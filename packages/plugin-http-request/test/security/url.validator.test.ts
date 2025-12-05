/**
 * URL 验证器测试
 */

import { expect } from 'chai';
import { UrlValidator } from '../../src';

describe('UrlValidator', () => {
    describe('Basic validation', () => {
        it('应该接受有效的 HTTP URL', () => {
            const validator = new UrlValidator();
            const result = validator.validate('http://example.com');
            expect(result.valid).to.be.true;
        });

        it('应该接受有效的 HTTPS URL', () => {
            const validator = new UrlValidator();
            const result = validator.validate('https://example.com');
            expect(result.valid).to.be.true;
        });

        it('应该拒绝无效的 URL', () => {
            const validator = new UrlValidator();
            const result = validator.validate('not-a-url');
            expect(result.valid).to.be.false;
            expect(result.reason).to.match(/invalid url/i);
        });

        it('应该拒绝非 HTTP 协议', () => {
            const validator = new UrlValidator();
            const protocols = ['ftp://example.com', 'file:///etc/passwd', 'gopher://example.com'];

            for (const url of protocols) {
                const result = validator.validate(url);
                expect(result.valid).to.be.false;
                expect(result.reason).to.match(/protocol/i);
            }
        });
    });

    describe('Whitelist validation', () => {
        it('应该接受白名单中的 URL', () => {
            const validator = new UrlValidator(['example.com']);
            const result = validator.validate('https://example.com/path');
            expect(result.valid).to.be.true;
            expect(result.inWhitelist).to.be.true;
        });

        it('应该拒绝不在白名单中的 URL', () => {
            const validator = new UrlValidator(['example.com']);
            const result = validator.validate('https://other.com');
            expect(result.valid).to.be.false;
            expect(result.reason).to.match(/not in whitelist/i);
        });

        it('应该支持域名模式组合', () => {
            // 使用组合模式：精确匹配 + 通配符匹配 = 匹配根域名和所有子域名
            const validator = new UrlValidator(['example.com', '*.example.com']);

            expect(validator.validate('https://example.com').valid).to.be.true;
            expect(validator.validate('https://api.example.com').valid).to.be.true;
            expect(validator.validate('https://www.example.com').valid).to.be.true;
            expect(validator.validate('https://other.com').valid).to.be.false;
        });
    });

    describe('Blacklist validation', () => {
        it('应该拒绝黑名单中的 URL', () => {
            const validator = new UrlValidator([], ['bad.com']);
            const result = validator.validate('https://bad.com');
            expect(result.valid).to.be.false;
            expect(result.inBlacklist).to.be.true;
            expect(result.reason).to.match(/blacklist/i);
        });

        it('应该接受不在黑名单中的 URL', () => {
            const validator = new UrlValidator([], ['bad.com']);
            const result = validator.validate('https://good.com');
            expect(result.valid).to.be.true;
            expect(result.inBlacklist).to.be.false;
        });

        it('应该支持黑名单中的域名模式', () => {
            const validator = new UrlValidator([], ['bad.com', '*.bad.com']);

            expect(validator.validate('https://bad.com').valid).to.be.false;
            expect(validator.validate('https://api.bad.com').valid).to.be.false;
            expect(validator.validate('https://good.com').valid).to.be.true;
        });
    });

    describe('Whitelist mode priority', () => {
        it('应该优先使用白名单模式', () => {
            const validator = new UrlValidator(['example.com', '*.example.com'], ['tmp.example.com']);
            const result = validator.validate('https://tmp.example.com');
            expect(result.valid).to.be.false;
        });
    });

    describe('Dynamic list management', () => {
        it('应该允许添加到白名单', () => {
            const validator = new UrlValidator();
            validator.addToWhitelist('example.com');

            const result = validator.validate('https://example.com');
            expect(result.valid).to.be.true;
        });

        it('应该允许添加多个项目到白名单', () => {
            const validator = new UrlValidator();
            validator.addToWhitelist('example.com', 'test.com', 'demo.com');

            expect(validator.getWhitelist()).to.have.lengthOf(3);
            expect(validator.validate('https://example.com').valid).to.be.true;
            expect(validator.validate('https://test.com').valid).to.be.true;
            expect(validator.validate('https://demo.com').valid).to.be.true;
        });

        it('应该允许添加到黑名单', () => {
            const validator = new UrlValidator();
            validator.addToBlacklist('bad.com');

            const result = validator.validate('https://bad.com');
            expect(result.valid).to.be.false;
            expect(result.inBlacklist).to.be.true;
        });

        it('应该允许添加多个项目到黑名单', () => {
            const validator = new UrlValidator();
            validator.addToBlacklist('bad1.com', 'bad2.com', 'bad3.com');

            expect(validator.getBlacklist()).to.have.lengthOf(3);
            expect(validator.validate('https://bad1.com').valid).to.be.false;
            expect(validator.validate('https://bad2.com').valid).to.be.false;
            expect(validator.validate('https://bad3.com').valid).to.be.false;
        });

        it('应该允许从白名单中移除', () => {
            const validator = new UrlValidator(['example.com']);
            validator.removeFromWhitelist('example.com');

            const result = validator.validate('https://example.com');
            expect(result.valid).to.be.true; // No whitelist, so allowed
        });

        it('应该允许从白名单中移除多个项目', () => {
            const validator = new UrlValidator(['example.com', 'test.com', 'demo.com']);
            validator.removeFromWhitelist('example.com', 'test.com');

            expect(validator.getWhitelist()).to.have.lengthOf(1);
            expect(validator.getWhitelist()).to.deep.equal(['demo.com']);
        });

        it('应该允许从黑名单中移除', () => {
            const validator = new UrlValidator([], ['bad.com']);
            validator.removeFromBlacklist('bad.com');

            const result = validator.validate('https://bad.com');
            expect(result.valid).to.be.true;
            expect(result.inBlacklist).to.be.false;
        });

        it('应该允许从黑名单中移除多个项目', () => {
            const validator = new UrlValidator([], ['bad1.com', 'bad2.com', 'bad3.com']);
            validator.removeFromBlacklist('bad1.com', 'bad3.com');

            expect(validator.getBlacklist()).to.have.lengthOf(1);
            expect(validator.getBlacklist()).to.deep.equal(['bad2.com']);
        });

        it('应该允许设置白名单', () => {
            const validator = new UrlValidator(['old.com']);
            validator.setWhitelist(['new.com', 'example.com']);

            expect(validator.getWhitelist()).to.deep.equal(['new.com', 'example.com']);
            expect(validator.validate('https://old.com').valid).to.be.false;
            expect(validator.validate('https://new.com').valid).to.be.true;
        });

        it('应该允许设置黑名单', () => {
            const validator = new UrlValidator([], ['old-bad.com']);
            validator.setBlacklist(['new-bad.com', 'another-bad.com']);

            expect(validator.getBlacklist()).to.deep.equal(['new-bad.com', 'another-bad.com']);
            expect(validator.validate('https://old-bad.com').valid).to.be.true;
            expect(validator.validate('https://new-bad.com').valid).to.be.false;
        });

        it('应该允许清空列表', () => {
            const validator = new UrlValidator(['example.com'], ['bad.com']);
            validator.clearWhitelist();
            validator.clearBlacklist();

            expect(validator.getWhitelist()).to.have.lengthOf(0);
            expect(validator.getBlacklist()).to.have.lengthOf(0);
        });

        it('应该返回列表的副本', () => {
            const validator = new UrlValidator(['example.com'], ['bad.com']);
            const whitelist = validator.getWhitelist();
            const blacklist = validator.getBlacklist();

            // 修改返回的数组不应影响内部状态
            whitelist.push('new.com');
            blacklist.push('new-bad.com');

            expect(validator.getWhitelist()).to.deep.equal(['example.com']);
            expect(validator.getBlacklist()).to.deep.equal(['bad.com']);
        });
    });

    describe('Pattern matching', () => {
        it('应该不区分大小写', () => {
            const validator = new UrlValidator(['Example.COM']);

            expect(validator.validate('https://example.com').valid).to.be.true;
            expect(validator.validate('https://EXAMPLE.COM').valid).to.be.true;
            expect(validator.validate('https://Example.Com').valid).to.be.true;
        });

        it('应该处理精确域名匹配', () => {
            const validator = new UrlValidator(['example.com']);

            expect(validator.validate('https://example.com').valid).to.be.true;
            expect(validator.validate('https://sub.example.com').valid).to.be.false;
            expect(validator.validate('https://example.com.cn').valid).to.be.false;
        });

        it('应该正确处理通配符模式', () => {
            const validator = new UrlValidator(['*.example.com']);

            expect(validator.validate('https://api.example.com').valid).to.be.true; // ✅ 一级子域名
            expect(validator.validate('https://www.example.com').valid).to.be.true; // ✅ 一级子域名
            expect(validator.validate('https://deep.sub.example.com').valid).to.be.false; // ❌ 多级子域名
            expect(validator.validate('https://example.com').valid).to.be.false; // ❌ 根域名
            expect(validator.validate('https://notexample.com').valid).to.be.false;
        });

        it('应该处理精确匹配和通配符模式的组合', () => {
            const validator = new UrlValidator(['example.com', '*.example.com']);

            expect(validator.validate('https://example.com').valid).to.be.true; // ✅ 精确匹配
            expect(validator.validate('https://api.example.com').valid).to.be.true; // ✅ 通配符匹配一级子域名
            expect(validator.validate('https://www.example.com').valid).to.be.true; // ✅ 通配符匹配一级子域名
            expect(validator.validate('https://v2.api.example.com').valid).to.be.false; // ❌ 多级子域名不匹配
            expect(validator.validate('https://notexample.com').valid).to.be.false;
        });
    });

    describe('Edge cases', () => {
        it('应该处理空的白名单和黑名单', () => {
            const validator = new UrlValidator([], []);

            expect(validator.validate('https://any.com').valid).to.be.true;
        });

        it('应该处理带端口的 URL', () => {
            const validator = new UrlValidator(['example.com']);

            expect(validator.validate('https://example.com:8080').valid).to.be.true;
        });

        it('应该处理带路径的 URL', () => {
            const validator = new UrlValidator(['example.com']);

            expect(validator.validate('https://example.com/path/to/resource').valid).to.be.true;
        });

        it('应该处理带查询参数的 URL', () => {
            const validator = new UrlValidator(['example.com']);

            expect(validator.validate('https://example.com?param=value').valid).to.be.true;
        });

        it('应该处理带片段的 URL', () => {
            const validator = new UrlValidator(['example.com']);

            expect(validator.validate('https://example.com#section').valid).to.be.true;
        });

        it('应该拒绝同时出现在白名单和黑名单中的 URL', () => {
            const validator = new UrlValidator(['example.com', '*.example.com'], ['bad.example.com']);

            // 在白名单中，但也在黑名单中
            const result = validator.validate('https://bad.example.com');
            expect(result.valid).to.be.false;
            expect(result.inWhitelist).to.be.true;
            expect(result.inBlacklist).to.be.true;
        });
    });
});

