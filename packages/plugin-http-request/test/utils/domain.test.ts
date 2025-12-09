/**
 * 域名匹配工具函数测试
 */

import { expect } from 'chai';
import { DomainUtils } from '../../src';

describe('createDomainMatchers (通配符模式)', () => {
    describe('精确匹配模式', () => {
        it('应该生成精确匹配的正则表达式', () => {
            const domains = ['www.example.com', 'api.github.com'];
            const regexps = DomainUtils.createDomainMatchers(domains);

            expect(regexps).to.have.lengthOf(2);
            expect(regexps[0].test('www.example.com')).to.be.true;
            expect(regexps[0].test('api.example.com')).to.be.false;
            expect(regexps[0].test('www.example.com.cn')).to.be.false;
            expect(regexps[0].test('subdomain.www.example.com')).to.be.false;

            expect(regexps[1].test('api.github.com')).to.be.true;
            expect(regexps[1].test('www.github.com')).to.be.false;
        });

        it('应该处理大小写不敏感的域名', () => {
            const domains = ['Example.COM', 'API.GitHub.COM'];
            const regexps = DomainUtils.createDomainMatchers(domains);

            expect(regexps[0].test('example.com')).to.be.true;
            expect(regexps[0].test('Example.COM')).to.be.true;
            expect(regexps[0].test('EXAMPLE.COM')).to.be.true;
            expect(regexps[1].test('api.github.com')).to.be.true;
            expect(regexps[1].test('API.GitHub.COM')).to.be.true;
        });
    });

    describe('通配符匹配模式', () => {
        it('应该生成 *.domain 的通配符匹配正则（只匹配一级子域名）', () => {
            const domains = ['*.example.com', '*.github.io'];
            const regexps = DomainUtils.createDomainMatchers(domains);

            expect(regexps).to.have.lengthOf(2);

            // 应该只匹配一级子域名，不包括根域名和多级子域名
            expect(regexps[0].test('www.example.com')).to.be.true; // ✅ 一级子域名
            expect(regexps[0].test('api.example.com')).to.be.true; // ✅ 一级子域名
            expect(regexps[0].test('sub.example.com')).to.be.true; // ✅ 一级子域名
            expect(regexps[0].test('api.sub.example.com')).to.be.false; // ❌ 多级子域名
            expect(regexps[0].test('deep.api.sub.example.com')).to.be.false; // ❌ 多级子域名
            expect(regexps[0].test('example.com')).to.be.false; // ❌ 不匹配根域名
            expect(regexps[0].test('notexample.com')).to.be.false;

            expect(regexps[1].test('user.github.io')).to.be.true; // ✅ 一级子域名
            expect(regexps[1].test('docs.user.github.io')).to.be.false; // ❌ 多级子域名
            expect(regexps[1].test('github.io')).to.be.false; // ❌ 不匹配根域名
        });

        it('应该正确转义特殊字符', () => {
            const domains = ['*.example-test.com'];
            const regexps = DomainUtils.createDomainMatchers(domains);

            expect(regexps[0].test('api.example-test.com')).to.be.true;
            expect(regexps[0].test('api.exampleXtest.com')).to.be.false; // - 不应被当作通配符
        });

        it('应该处理大小写（通配符模式）', () => {
            const domains = ['*.Example.COM'];
            const regexps = DomainUtils.createDomainMatchers(domains);

            expect(regexps[0].test('api.example.com')).to.be.true;
            expect(regexps[0].test('api.Example.COM')).to.be.true;
            expect(regexps[0].test('API.EXAMPLE.COM')).to.be.true;
            expect(regexps[0].test('example.com')).to.be.false;
        });
    });

    describe('混合模式', () => {
        it('应该正确处理多种模式的混合', () => {
            const domains = [
                'exact.example.com',    // 精确匹配
                '*.suffix.com',         // 通配符匹配（一级子域名）
                'api.test.com'          // 精确匹配
            ];
            const regexps = DomainUtils.createDomainMatchers(domains);

            expect(regexps).to.have.lengthOf(3);

            // 精确匹配
            expect(regexps[0].test('exact.example.com')).to.be.true;
            expect(regexps[0].test('other.example.com')).to.be.false;

            // 通配符匹配（只匹配一级子域名）
            expect(regexps[1].test('www.suffix.com')).to.be.true; // ✅ 一级子域名
            expect(regexps[1].test('api.www.suffix.com')).to.be.false; // ❌ 多级子域名
            expect(regexps[1].test('suffix.com')).to.be.false; // ❌ 不匹配根域名

            // 精确匹配
            expect(regexps[2].test('api.test.com')).to.be.true;
            expect(regexps[2].test('www.test.com')).to.be.false;
        });
    });

    describe('特殊字符转义', () => {
        it('应该正确转义正则表达式特殊字符（精确匹配）', () => {
            const domains = [
                'test[bracket].com',
                'test(paren).com',
                'test+plus.com',
                'test?question.com'
            ];
            const regexps = DomainUtils.createDomainMatchers(domains);

            expect(regexps[0].test('test[bracket].com')).to.be.true;
            expect(regexps[1].test('test(paren).com')).to.be.true;
            expect(regexps[2].test('test+plus.com')).to.be.true;
            expect(regexps[3].test('test?question.com')).to.be.true;

            // 特殊字符不应作为正则通配符
            expect(regexps[0].test('testXbracketY.com')).to.be.false;
        });

        it('应该正确转义通配符模式中的特殊字符', () => {
            const domains = ['*.test-site.com', '*.test_site.com'];
            const regexps = DomainUtils.createDomainMatchers(domains);

            expect(regexps[0].test('api.test-site.com')).to.be.true;
            expect(regexps[0].test('api.testXsite.com')).to.be.false;
            expect(regexps[1].test('api.test_site.com')).to.be.true;
        });
    });

    describe('空数组和边界情况', () => {
        it('应该处理空数组', () => {
            const domains: string[] = [];
            const regexps = DomainUtils.createDomainMatchers(domains);

            expect(regexps).to.be.an('array').that.is.empty;
        });

        it('应该处理单个域名', () => {
            const domains = ['single.com'];
            const regexps = DomainUtils.createDomainMatchers(domains);

            expect(regexps).to.have.lengthOf(1);
            expect(regexps[0].test('single.com')).to.be.true;
            expect(regexps[0].test('api.single.com')).to.be.false;
        });

        it('应该处理带空格的域名（自动 trim）', () => {
            const domains = [' example.com ', ' *.test.com '];
            const regexps = DomainUtils.createDomainMatchers(domains);

            expect(regexps[0].test('example.com')).to.be.true;
            expect(regexps[1].test('api.test.com')).to.be.true;
        });

        it('应该正确区分精确匹配和通配符匹配', () => {
            const domains = ['example.com', '*.example.com'];
            const regexps = DomainUtils.createDomainMatchers(domains);

            // 精确匹配：只匹配 example.com
            expect(regexps[0].test('example.com')).to.be.true;
            expect(regexps[0].test('api.example.com')).to.be.false;

            // 通配符匹配：只匹配一级子域名，不匹配根域名和多级子域名
            expect(regexps[1].test('api.example.com')).to.be.true; // ✅ 一级子域名
            expect(regexps[1].test('www.example.com')).to.be.true; // ✅ 一级子域名
            expect(regexps[1].test('test.api.example.com')).to.be.false; // ❌ 多级子域名
            expect(regexps[1].test('example.com')).to.be.false; // ❌ 根域名
        });
    });
});

describe('createLegacyDomainMatchers (传统模式，用于正向代理)', () => {
    describe('精确匹配模式', () => {
        it('应该生成精确匹配的正则表达式', () => {
            const domains = ['www.example.com', 'api.github.com'];
            const regexps = DomainUtils.createLegacyDomainMatchers(domains);

            expect(regexps).to.have.lengthOf(2);
            expect(regexps[0].test('www.example.com')).to.be.true;
            expect(regexps[0].test('api.example.com')).to.be.false;
            expect(regexps[0].test('www.example.com.cn')).to.be.false;
            expect(regexps[0].test('subdomain.www.example.com')).to.be.false;

            expect(regexps[1].test('api.github.com')).to.be.true;
            expect(regexps[1].test('www.github.com')).to.be.false;
        });

        it('应该处理大小写不敏感的域名', () => {
            const domains = ['Example.COM', 'API.GitHub.COM'];
            const regexps = DomainUtils.createLegacyDomainMatchers(domains);

            expect(regexps[0].test('example.com')).to.be.true;
            expect(regexps[0].test('Example.COM')).to.be.true;
            expect(regexps[0].test('EXAMPLE.COM')).to.be.true;
            expect(regexps[1].test('api.github.com')).to.be.true;
            expect(regexps[1].test('API.GitHub.COM')).to.be.true;
        });
    });

    describe('后缀匹配模式', () => {
        it('应该生成以点开头的后缀匹配正则', () => {
            const domains = ['.example.com', '.github.io'];
            const regexps = DomainUtils.createLegacyDomainMatchers(domains);

            expect(regexps).to.have.lengthOf(2);

            // 应该匹配以该后缀结尾的域名
            expect(regexps[0].test('www.example.com')).to.be.true;
            expect(regexps[0].test('.example.com')).to.be.true;
            expect(regexps[0].test('sub.example.com')).to.be.true;
            expect(regexps[0].test('api.sub.example.com')).to.be.true;
            expect(regexps[0].test('deep.api.sub.example.com')).to.be.true;
            expect(regexps[0].test('example.com')).to.be.false; // 不匹配根域名
            expect(regexps[0].test('notexample.com')).to.be.false;

            expect(regexps[1].test('.github.io')).to.be.true;
            expect(regexps[1].test('user.github.io')).to.be.true;
            expect(regexps[1].test('docs.user.github.io')).to.be.true;
            expect(regexps[1].test('github.io')).to.be.false;
        });

        it('应该正确转义特殊字符', () => {
            const domains = ['.example-test.com'];
            const regexps = DomainUtils.createLegacyDomainMatchers(domains);

            expect(regexps[0].test('.example-test.com')).to.be.true;
            expect(regexps[0].test('.exampleXtest.com')).to.be.false;
        });
    });

    describe('前缀匹配模式', () => {
        it('应该生成以点结尾的前缀匹配正则', () => {
            const domains = ['192.168.0.', '172.16.'];
            const regexps = DomainUtils.createLegacyDomainMatchers(domains);

            expect(regexps).to.have.lengthOf(2);

            expect(regexps[0].test('192.168.0.')).to.be.true;
            expect(regexps[0].test('192.168.0.1')).to.be.true;
            expect(regexps[0].test('192.168.0.255')).to.be.true;
            expect(regexps[0].test('192.168.1.1')).to.be.false;
            expect(regexps[0].test('10.0.0.1')).to.be.false;

            expect(regexps[1].test('172.16.')).to.be.true;
            expect(regexps[1].test('172.16.0.1')).to.be.true;
            expect(regexps[1].test('172.17.0.1')).to.be.false;
        });
    });

    describe('混合模式', () => {
        it('应该正确处理多种模式的混合', () => {
            const domains = [
                'exact.example.com',    // 精确匹配
                '.suffix.com',          // 后缀匹配
                '192.168.'              // 前缀匹配
            ];
            const regexps = DomainUtils.createLegacyDomainMatchers(domains);

            expect(regexps).to.have.lengthOf(3);

            // 精确匹配
            expect(regexps[0].test('exact.example.com')).to.be.true;
            expect(regexps[0].test('other.example.com')).to.be.false;

            // 后缀匹配
            expect(regexps[1].test('.suffix.com')).to.be.true;
            expect(regexps[1].test('www.suffix.com')).to.be.true;
            expect(regexps[1].test('suffix.com')).to.be.false;

            // 前缀匹配
            expect(regexps[2].test('192.168.1.1')).to.be.true;
            expect(regexps[2].test('10.0.0.1')).to.be.false;
        });
    });
});

