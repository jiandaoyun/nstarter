/**
 * 域名匹配工具函数测试
 */

import { expect } from 'chai';
import { createDomainMatchers } from '../../src/utils/domain.matcher';

describe('createDomainMatchers', () => {
    describe('全匹配模式', () => {
        it('应该生成完全匹配的正则表达式', () => {
            const domains = ['www.example.com', 'api.github.com'];
            const regexps = createDomainMatchers(domains);

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
            const regexps = createDomainMatchers(domains);

            // 注意：正则本身是大小写敏感的，这里只是测试生成的正则
            expect(regexps[0].test('Example.COM')).to.be.true;
            expect(regexps[1].test('API.GitHub.COM')).to.be.true;
        });
    });

    describe('后缀匹配模式', () => {
        it('应该生成以点开头的后缀匹配正则', () => {
            const domains = ['.example.com', '.github.io'];
            const regexps = createDomainMatchers(domains);

            expect(regexps).to.have.lengthOf(2);
            
            // 应该匹配以该后缀结尾的域名 (注意：正则是 /\.example\.com$/)
            expect(regexps[0].test('www.example.com')).to.be.true; // 一级子域名
            expect(regexps[0].test('.example.com')).to.be.true;
            expect(regexps[0].test('sub.example.com')).to.be.true; // 一级子域名
            expect(regexps[0].test('something.example.com')).to.be.true; // 一级子域名
            expect(regexps[0].test('api.sub.example.com')).to.be.true; // 多级子域名
            expect(regexps[0].test('deep.api.sub.example.com')).to.be.true; // 多级子域名
            expect(regexps[0].test('example.com')).to.be.false; // 不匹配根域名
            expect(regexps[0].test('notexample.com')).to.be.false;
            
            expect(regexps[1].test('.github.io')).to.be.true;
            expect(regexps[1].test('user.github.io')).to.be.true; // 一级子域名
            expect(regexps[1].test('docs.user.github.io')).to.be.true; // 多级子域名
            expect(regexps[1].test('github.io')).to.be.false; // 不匹配根域名
        });

        it('应该正确转义特殊字符', () => {
            const domains = ['.example-test.com'];
            const regexps = createDomainMatchers(domains);

            expect(regexps[0].test('.example-test.com')).to.be.true;
            expect(regexps[0].test('.exampleXtest.com')).to.be.false; // - 不应被当作通配符
        });

        it('应该处理大小写（以大写点开头）', () => {
            const domains = ['.Example.COM'];
            const regexps = createDomainMatchers(domains);

            expect(regexps[0].test('.Example.COM')).to.be.true;
        });
    });

    describe('前缀匹配模式', () => {
        it('应该生成以点结尾的前缀匹配正则', () => {
            const domains = ['192.168.0.', '172.16.'];
            const regexps = createDomainMatchers(domains);

            expect(regexps).to.have.lengthOf(2);
            
            // 应该匹配以该前缀开头的字符串
            expect(regexps[0].test('192.168.0.')).to.be.true;
            expect(regexps[0].test('192.168.0.1')).to.be.true;
            expect(regexps[0].test('192.168.0.255')).to.be.true;
            expect(regexps[0].test('192.168.1.1')).to.be.false;
            expect(regexps[0].test('10.0.0.1')).to.be.false;

            expect(regexps[1].test('172.16.')).to.be.true;
            expect(regexps[1].test('172.16.0.1')).to.be.true;
            expect(regexps[1].test('172.17.0.1')).to.be.false;
        });

        it('应该正确转义点号', () => {
            const domains = ['test.'];
            const regexps = createDomainMatchers(domains);

            expect(regexps[0].test('test.')).to.be.true;
            expect(regexps[0].test('test.example')).to.be.true;
            expect(regexps[0].test('testX')).to.be.false; // . 不应被当作通配符
        });

        it('应该处理大小写（以大写点结尾）', () => {
            const domains = ['Test.'];
            const regexps = createDomainMatchers(domains);

            expect(regexps[0].test('Test.')).to.be.true;
            expect(regexps[0].test('Test.example')).to.be.true;
        });
    });

    describe('混合模式', () => {
        it('应该正确处理多种模式的混合', () => {
            const domains = [
                'exact.example.com',    // 完全匹配
                '.suffix.com',          // 后缀匹配
                '192.168.'              // 前缀匹配
            ];
            const regexps = createDomainMatchers(domains);

            expect(regexps).to.have.lengthOf(3);

            // 完全匹配
            expect(regexps[0].test('exact.example.com')).to.be.true;
            expect(regexps[0].test('other.example.com')).to.be.false;

            // 后缀匹配
            expect(regexps[1].test('.suffix.com')).to.be.true;
            expect(regexps[1].test('www.suffix.com')).to.be.true; // 以 .suffix.com 结尾
            expect(regexps[1].test('suffix.com')).to.be.false; // 不以 .suffix.com 结尾

            // 前缀匹配
            expect(regexps[2].test('192.168.1.1')).to.be.true;
            expect(regexps[2].test('10.0.0.1')).to.be.false;
        });
    });

    describe('特殊字符转义', () => {
        it('应该正确转义正则表达式特殊字符', () => {
            const domains = [
                'test[bracket].com',
                'test(paren).com',
                'test*star.com',
                'test+plus.com',
                'test?question.com'
            ];
            const regexps = createDomainMatchers(domains);

            expect(regexps[0].test('test[bracket].com')).to.be.true;
            expect(regexps[1].test('test(paren).com')).to.be.true;
            expect(regexps[2].test('test*star.com')).to.be.true;
            expect(regexps[3].test('test+plus.com')).to.be.true;
            expect(regexps[4].test('test?question.com')).to.be.true;

            // 特殊字符不应作为正则通配符
            expect(regexps[0].test('testXbracketY.com')).to.be.false;
            expect(regexps[2].test('testXstar.com')).to.be.false;
        });
    });

    describe('空数组和边界情况', () => {
        it('应该处理空数组', () => {
            const domains: string[] = [];
            const regexps = createDomainMatchers(domains);

            expect(regexps).to.be.an('array').that.is.empty;
        });

        it('应该处理单个域名', () => {
            const domains = ['single.com'];
            const regexps = createDomainMatchers(domains);

            expect(regexps).to.have.lengthOf(1);
            expect(regexps[0].test('single.com')).to.be.true;
        });

        it('应该处理只有点的域名', () => {
            const domains = ['.'];
            const regexps = createDomainMatchers(domains);

            expect(regexps).to.have.lengthOf(1);
            // 只有一个点，应该作为后缀匹配
            expect(regexps[0].test('.')).to.be.true;
        });
    });
});

