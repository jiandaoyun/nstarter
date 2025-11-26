/**
 * URL 验证器测试
 */

import { expect } from 'chai';
import { UrlValidator } from '../../src';

describe('UrlValidator', () => {
    describe('Basic validation', () => {
        it('should accept valid HTTP URLs', () => {
            const validator = new UrlValidator();
            const result = validator.validate('http://example.com');
            expect(result.valid).to.be.true;
        });

        it('should accept valid HTTPS URLs', () => {
            const validator = new UrlValidator();
            const result = validator.validate('https://example.com');
            expect(result.valid).to.be.true;
        });

        it('should reject invalid URLs', () => {
            const validator = new UrlValidator();
            const result = validator.validate('not-a-url');
            expect(result.valid).to.be.false;
            expect(result.reason).to.match(/invalid url/i);
        });

        it('should reject non-HTTP protocols', () => {
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
        it('should accept URLs in whitelist', () => {
            const validator = new UrlValidator(['example.com']);
            const result = validator.validate('https://example.com/path');
            expect(result.valid).to.be.true;
            expect(result.inWhitelist).to.be.true;
        });

        it('should reject URLs not in whitelist', () => {
            const validator = new UrlValidator(['example.com']);
            const result = validator.validate('https://other.com');
            expect(result.valid).to.be.false;
            expect(result.reason).to.match(/not in whitelist/i);
        });

        it('should support wildcard patterns', () => {
            const validator = new UrlValidator(['*.example.com']);

            expect(validator.validate('https://api.example.com').valid).to.be.true;
            expect(validator.validate('https://www.example.com').valid).to.be.true;
            expect(validator.validate('https://example.com').valid).to.be.true;
            expect(validator.validate('https://other.com').valid).to.be.false;
        });
    });

    describe('Blacklist validation', () => {
        it('should reject URLs in blacklist', () => {
            const validator = new UrlValidator([], ['bad.com']);
            const result = validator.validate('https://bad.com');
            expect(result.valid).to.be.false;
            expect(result.inBlacklist).to.be.true;
            expect(result.reason).to.match(/blacklist/i);
        });

        it('should accept URLs not in blacklist', () => {
            const validator = new UrlValidator([], ['bad.com']);
            const result = validator.validate('https://good.com');
            expect(result.valid).to.be.true;
            expect(result.inBlacklist).to.be.false;
        });

        it('should support wildcard patterns in blacklist', () => {
            const validator = new UrlValidator([], ['*.bad.com']);

            expect(validator.validate('https://api.bad.com').valid).to.be.false;
            expect(validator.validate('https://bad.com').valid).to.be.false;
            expect(validator.validate('https://good.com').valid).to.be.true;
        });
    });

    describe('Whitelist mode priority', () => {
        it('should prioritize whitelist mode', () => {
            const validator = new UrlValidator(['*.example.com'], ['tmp.example.com']);
            const result = validator.validate('https://tmp.example.com');
            expect(result.valid).to.be.false;
        });
    });

    describe('Dynamic list management', () => {
        it('should allow adding to whitelist', () => {
            const validator = new UrlValidator();
            validator.addToWhitelist('example.com');

            const result = validator.validate('https://example.com');
            expect(result.valid).to.be.true;
        });

        it('should allow adding multiple items to whitelist', () => {
            const validator = new UrlValidator();
            validator.addToWhitelist('example.com', 'test.com', 'demo.com');

            expect(validator.getWhitelist()).to.have.lengthOf(3);
            expect(validator.validate('https://example.com').valid).to.be.true;
            expect(validator.validate('https://test.com').valid).to.be.true;
            expect(validator.validate('https://demo.com').valid).to.be.true;
        });

        it('should allow adding to blacklist', () => {
            const validator = new UrlValidator();
            validator.addToBlacklist('bad.com');

            const result = validator.validate('https://bad.com');
            expect(result.valid).to.be.false;
            expect(result.inBlacklist).to.be.true;
        });

        it('should allow adding multiple items to blacklist', () => {
            const validator = new UrlValidator();
            validator.addToBlacklist('bad1.com', 'bad2.com', 'bad3.com');

            expect(validator.getBlacklist()).to.have.lengthOf(3);
            expect(validator.validate('https://bad1.com').valid).to.be.false;
            expect(validator.validate('https://bad2.com').valid).to.be.false;
            expect(validator.validate('https://bad3.com').valid).to.be.false;
        });

        it('should allow removing from whitelist', () => {
            const validator = new UrlValidator(['example.com']);
            validator.removeFromWhitelist('example.com');

            const result = validator.validate('https://example.com');
            expect(result.valid).to.be.true; // No whitelist, so allowed
        });

        it('should allow removing multiple items from whitelist', () => {
            const validator = new UrlValidator(['example.com', 'test.com', 'demo.com']);
            validator.removeFromWhitelist('example.com', 'test.com');

            expect(validator.getWhitelist()).to.have.lengthOf(1);
            expect(validator.getWhitelist()).to.deep.equal(['demo.com']);
        });

        it('should allow removing from blacklist', () => {
            const validator = new UrlValidator([], ['bad.com']);
            validator.removeFromBlacklist('bad.com');

            const result = validator.validate('https://bad.com');
            expect(result.valid).to.be.true;
            expect(result.inBlacklist).to.be.false;
        });

        it('should allow removing multiple items from blacklist', () => {
            const validator = new UrlValidator([], ['bad1.com', 'bad2.com', 'bad3.com']);
            validator.removeFromBlacklist('bad1.com', 'bad3.com');

            expect(validator.getBlacklist()).to.have.lengthOf(1);
            expect(validator.getBlacklist()).to.deep.equal(['bad2.com']);
        });

        it('should allow setting whitelist', () => {
            const validator = new UrlValidator(['old.com']);
            validator.setWhitelist(['new.com', 'example.com']);

            expect(validator.getWhitelist()).to.deep.equal(['new.com', 'example.com']);
            expect(validator.validate('https://old.com').valid).to.be.false;
            expect(validator.validate('https://new.com').valid).to.be.true;
        });

        it('should allow setting blacklist', () => {
            const validator = new UrlValidator([], ['old-bad.com']);
            validator.setBlacklist(['new-bad.com', 'another-bad.com']);

            expect(validator.getBlacklist()).to.deep.equal(['new-bad.com', 'another-bad.com']);
            expect(validator.validate('https://old-bad.com').valid).to.be.true;
            expect(validator.validate('https://new-bad.com').valid).to.be.false;
        });

        it('should allow clearing lists', () => {
            const validator = new UrlValidator(['example.com'], ['bad.com']);
            validator.clearWhitelist();
            validator.clearBlacklist();

            expect(validator.getWhitelist()).to.have.lengthOf(0);
            expect(validator.getBlacklist()).to.have.lengthOf(0);
        });

        it('should return copies of lists', () => {
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
        it('should support prefix wildcards', () => {
            const validator = new UrlValidator(['test-*']);

            expect(validator.validate('https://test-api.com').valid).to.be.true;
            expect(validator.validate('https://test-web.com').valid).to.be.true;
            expect(validator.validate('https://test-123.com').valid).to.be.true;
            expect(validator.validate('https://prod-api.com').valid).to.be.false;
        });

        it('should support middle wildcards', () => {
            const validator = new UrlValidator(['*-test-*.com']);

            // 正则替换: *-test-*.com -> .*-test-.*\.com
            expect(validator.validate('https://api-test-v1.com').valid).to.be.true;
            expect(validator.validate('https://web-test-v2.com').valid).to.be.true;
            expect(validator.validate('https://test.com').valid).to.be.false;
        });

        it('should be case insensitive', () => {
            const validator = new UrlValidator(['Example.COM']);

            expect(validator.validate('https://example.com').valid).to.be.true;
            expect(validator.validate('https://EXAMPLE.COM').valid).to.be.true;
            expect(validator.validate('https://Example.Com').valid).to.be.true;
        });

        it('should handle exact domain match', () => {
            const validator = new UrlValidator(['example.com']);

            expect(validator.validate('https://example.com').valid).to.be.true;
            expect(validator.validate('https://sub.example.com').valid).to.be.false;
            expect(validator.validate('https://example.com.cn').valid).to.be.false;
        });

        it('should handle subdomain wildcards correctly', () => {
            const validator = new UrlValidator(['*.example.com']);

            expect(validator.validate('https://sub.example.com').valid).to.be.true;
            expect(validator.validate('https://deep.sub.example.com').valid).to.be.true;
            expect(validator.validate('https://example.com').valid).to.be.true; // 根域名也匹配
            expect(validator.validate('https://notexample.com').valid).to.be.false;
        });
    });

    describe('Edge cases', () => {
        it('should handle empty whitelist and blacklist', () => {
            const validator = new UrlValidator([], []);

            expect(validator.validate('https://any.com').valid).to.be.true;
        });

        it('should handle URLs with ports', () => {
            const validator = new UrlValidator(['example.com']);

            expect(validator.validate('https://example.com:8080').valid).to.be.true;
        });

        it('should handle URLs with paths', () => {
            const validator = new UrlValidator(['example.com']);

            expect(validator.validate('https://example.com/path/to/resource').valid).to.be.true;
        });

        it('should handle URLs with query parameters', () => {
            const validator = new UrlValidator(['example.com']);

            expect(validator.validate('https://example.com?param=value').valid).to.be.true;
        });

        it('should handle URLs with fragments', () => {
            const validator = new UrlValidator(['example.com']);

            expect(validator.validate('https://example.com#section').valid).to.be.true;
        });

        it('should reject when both in whitelist and blacklist', () => {
            const validator = new UrlValidator(['*.example.com'], ['bad.example.com']);

            // 在白名单中，但也在黑名单中
            const result = validator.validate('https://bad.example.com');
            expect(result.valid).to.be.false;
            expect(result.inWhitelist).to.be.true;
            expect(result.inBlacklist).to.be.true;
        });
    });
});

