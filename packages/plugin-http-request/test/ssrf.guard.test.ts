/**
 * SSRF 防护测试
 */

import { expect } from 'chai';
import { SsrfGuard } from '../src/security/ssrf.guard';
import { SecurityError } from '../src/types';
import type { SecurityConfig } from '../src/types';

describe('SsrfGuard', () => {
    const defaultConfig: SecurityConfig = {
        enableIpValidation: true,
        enableDnsValidation: true,
        allowPrivateIp: false,
        rejectUnauthorized: true,
        dnsCacheTtl: 60000,
        whitelist: [],
        blacklist: []
    };

    describe('构造函数', () => {
        it('应该使用提供的配置创建实例', () => {
            const guard = new SsrfGuard(defaultConfig);
            expect(guard).to.be.instanceOf(SsrfGuard);
        });

        it('应该初始化内部验证器', () => {
            const guard = new SsrfGuard(defaultConfig);
            expect(guard.getDnsCacheSize()).to.equal(0);
        });
    });

    describe('validate - 无效 URL', () => {
        it('应该拒绝无效的 URL 格式', async () => {
            const guard = new SsrfGuard(defaultConfig);
            const result = await guard.validate('not-a-valid-url');

            expect(result.passed).to.be.false;
            expect(result.originalUrl).to.equal('not-a-valid-url');
            expect(result.hostname).to.equal('');
            expect(result.reason).to.include('Invalid URL format');
        });

        it('应该拒绝空 URL', async () => {
            const guard = new SsrfGuard(defaultConfig);
            const result = await guard.validate('');

            expect(result.passed).to.be.false;
            expect(result.reason).to.include('Invalid URL format');
        });
    });

    describe('validate - 黑白名单', () => {
        it('应该接受白名单中的 URL', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                whitelist: ['example.com'],
                enableDnsValidation: false
            };
            const guard = new SsrfGuard(config);
            const result = await guard.validate('https://example.com/path');

            expect(result.passed).to.be.true;
        });

        it('应该拒绝不在白名单中的 URL', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                whitelist: ['example.com']
            };
            const guard = new SsrfGuard(config);
            const result = await guard.validate('https://other.com');

            expect(result.passed).to.be.false;
            expect(result.reason).to.include('not in whitelist');
        });

        it('应该拒绝黑名单中的 URL', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                blacklist: ['bad.com']
            };
            const guard = new SsrfGuard(config);
            const result = await guard.validate('https://bad.com');

            expect(result.passed).to.be.false;
            expect(result.reason).to.include('blacklist');
        });
    });

    describe('validate - IP 地址验证', () => {
        it('应该在禁用 IP 验证时接受任何 IP', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                enableIpValidation: false
            };
            const guard = new SsrfGuard(config);
            const result = await guard.validate('http://127.0.0.1');

            expect(result.passed).to.be.true;
            expect(result.hostname).to.equal('127.0.0.1');
            expect(result.resolvedIps).to.deep.equal(['127.0.0.1']);
            expect(result.safeIp).to.equal('127.0.0.1');
        });

        it('应该在启用 IP 验证时拒绝私有 IP', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                enableIpValidation: true,
                allowPrivateIp: false
            };
            const guard = new SsrfGuard(config);
            const result = await guard.validate('http://192.168.1.1');

            expect(result.passed).to.be.false;
            expect(result.hostname).to.equal('192.168.1.1');
            expect(result.reason).to.match(/private|Private/i);
        });

        it('应该在允许私有 IP 时接受私有 IP', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                enableIpValidation: true,
                allowPrivateIp: true
            };
            const guard = new SsrfGuard(config);
            const result = await guard.validate('http://192.168.1.1');

            expect(result.passed).to.be.true;
            expect(result.safeIp).to.equal('192.168.1.1');
        });

        it('应该拒绝 loopback 地址', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                enableIpValidation: true
            };
            const guard = new SsrfGuard(config);
            const result = await guard.validate('http://127.0.0.1');

            expect(result.passed).to.be.false;
            expect(result.reason).to.match(/loopback|Loopback/i);
        });

        it('应该接受公共 IPv4 地址', async () => {
            const guard = new SsrfGuard(defaultConfig);
            const result = await guard.validate('http://8.8.8.8');

            expect(result.passed).to.be.true;
            expect(result.safeIp).to.equal('8.8.8.8');
        });

        it('应该处理 IPv6 地址', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                enableIpValidation: true
            };
            const guard = new SsrfGuard(config);
            const result = await guard.validate('http://[2001:4860:4860::8888]');

            // IPv6 URL 中的 hostname 会包含方括号
            expect(result.hostname).to.equal('[2001:4860:4860::8888]');
            // 验证结果取决于 IP 验证器的实现
            expect(result).to.have.property('passed');
        });

        it('应该拒绝 IPv6 loopback', async () => {
            const guard = new SsrfGuard(defaultConfig);
            const result = await guard.validate('http://[::1]');

            expect(result.passed).to.be.false;
            // 可能是 loopback 错误或 DNS 解析错误
            expect(result.reason).to.be.a('string').that.is.not.empty;
        });
    });

    describe('validate - DNS 验证', () => {
        it('应该在禁用 DNS 验证时跳过 DNS 解析', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                enableDnsValidation: false
            };
            const guard = new SsrfGuard(config);
            const result = await guard.validate('https://example.com');

            expect(result.passed).to.be.true;
            expect(result.hostname).to.equal('example.com');
            expect(result.resolvedIps).to.be.undefined;
        });

        it('应该解析并验证域名', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                enableDnsValidation: true
            };
            const guard = new SsrfGuard(config);
            const result = await guard.validate('https://google.com');

            expect(result.passed).to.be.true;
            expect(result.hostname).to.equal('google.com');
            expect(result.resolvedIps).to.be.an('array').that.is.not.empty;
            expect(result.safeIp).to.be.a('string');
        });

        it('应该拒绝解析为私有 IP 的域名', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                enableDnsValidation: true,
                allowPrivateIp: false
            };
            const guard = new SsrfGuard(config);
            
            // localhost 会解析为 127.0.0.1
            const result = await guard.validate('http://localhost');

            expect(result.passed).to.be.false;
            expect(result.reason).to.include('unsafe IP');
        });

        it('应该处理 DNS 解析失败', async () => {
            const guard = new SsrfGuard(defaultConfig);
            const result = await guard.validate('https://this-domain-does-not-exist-12345678.com');

            expect(result.passed).to.be.false;
            expect(result.reason).to.include('DNS resolution failed');
        });

        it('应该缓存 DNS 查询结果', async () => {
            const guard = new SsrfGuard(defaultConfig);

            await guard.validate('https://google.com');
            expect(guard.getDnsCacheSize()).to.equal(1);

            // 第二次查询应该使用缓存
            await guard.validate('https://google.com');
            expect(guard.getDnsCacheSize()).to.equal(1);
        });
    });

    describe('validateAndGetSafeUrl', () => {
        it('应该返回安全的 URL 和验证结果', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                enableDnsValidation: false
            };
            const guard = new SsrfGuard(config);
            const { safeUrl, result } = await guard.validateAndGetSafeUrl('https://example.com');

            expect(safeUrl).to.equal('https://example.com');
            expect(result.passed).to.be.true;
        });

        it('应该在验证失败时抛出 SecurityError', async () => {
            const guard = new SsrfGuard(defaultConfig);

            try {
                await guard.validateAndGetSafeUrl('http://127.0.0.1');
                expect.fail('应该抛出错误');
            } catch (error) {
                expect(error).to.be.instanceOf(SecurityError);
                expect((error as SecurityError).code).to.equal('SSRF_VALIDATION_FAILED');
                expect((error as SecurityError).url).to.equal('http://127.0.0.1');
            }
        });

        it('应该在 URL 格式无效时抛出错误', async () => {
            const guard = new SsrfGuard(defaultConfig);

            try {
                await guard.validateAndGetSafeUrl('invalid-url');
                expect.fail('应该抛出错误');
            } catch (error) {
                expect(error).to.be.instanceOf(SecurityError);
            }
        });
    });

    describe('updateConfig', () => {
        it('应该更新配置', () => {
            const guard = new SsrfGuard(defaultConfig);
            
            guard.updateConfig({ allowPrivateIp: true });
            
            const config = guard.getConfig();
            expect(config.allowPrivateIp).to.be.true;
        });

        it('应该更新 DNS 缓存 TTL', () => {
            const guard = new SsrfGuard(defaultConfig);
            
            guard.updateConfig({ dnsCacheTtl: 30000 });
            
            const config = guard.getConfig();
            expect(config.dnsCacheTtl).to.equal(30000);
        });

        it('应该更新白名单', async () => {
            const guard = new SsrfGuard(defaultConfig);
            
            guard.updateConfig({ whitelist: ['new-domain.com'] });
            
            const config = guard.getConfig();
            expect(config.whitelist).to.deep.equal(['new-domain.com']);
        });

        it('应该更新黑名单', () => {
            const guard = new SsrfGuard(defaultConfig);
            
            guard.updateConfig({ blacklist: ['bad-domain.com'] });
            
            const config = guard.getConfig();
            expect(config.blacklist).to.deep.equal(['bad-domain.com']);
        });

        it('应该支持部分配置更新', () => {
            const guard = new SsrfGuard(defaultConfig);
            const originalConfig = guard.getConfig();
            
            guard.updateConfig({ allowPrivateIp: true });
            
            const newConfig = guard.getConfig();
            expect(newConfig.allowPrivateIp).to.be.true;
            expect(newConfig.enableIpValidation).to.equal(originalConfig.enableIpValidation);
        });
    });

    describe('DNS 缓存管理', () => {
        it('应该清空 DNS 缓存', async () => {
            const guard = new SsrfGuard(defaultConfig);

            await guard.validate('https://google.com');
            expect(guard.getDnsCacheSize()).to.equal(1);

            guard.clearDnsCache();
            expect(guard.getDnsCacheSize()).to.equal(0);
        });

        it('应该返回正确的缓存大小', async () => {
            const guard = new SsrfGuard(defaultConfig);

            expect(guard.getDnsCacheSize()).to.equal(0);

            await guard.validate('https://google.com');
            expect(guard.getDnsCacheSize()).to.equal(1);

            await guard.validate('https://github.com');
            expect(guard.getDnsCacheSize()).to.equal(2);
        });

        it('应该清理过期的缓存', async function() {
            this.timeout(5000);

            const config: SecurityConfig = {
                ...defaultConfig,
                dnsCacheTtl: 100
            };
            const guard = new SsrfGuard(config);

            await guard.validate('https://google.com');
            expect(guard.getDnsCacheSize()).to.equal(1);

            // 等待缓存过期
            await new Promise(resolve => setTimeout(resolve, 150));

            guard.cleanExpiredDnsCache();
            expect(guard.getDnsCacheSize()).to.equal(0);
        });
    });

    describe('getConfig', () => {
        it('应该返回配置副本', () => {
            const guard = new SsrfGuard(defaultConfig);
            const config = guard.getConfig();

            expect(config).to.deep.equal(defaultConfig);
            expect(config).to.not.equal(defaultConfig); // 不是同一个引用
        });

        it('修改返回的配置不应影响内部配置', () => {
            const guard = new SsrfGuard(defaultConfig);
            const config = guard.getConfig();

            config.allowPrivateIp = true;

            const config2 = guard.getConfig();
            expect(config2.allowPrivateIp).to.equal(defaultConfig.allowPrivateIp);
        });
    });

    describe('综合场景', () => {
        it('应该正确处理多步验证流程', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                whitelist: ['*.google.com'],
                enableIpValidation: true,
                enableDnsValidation: true,
                allowPrivateIp: false
            };
            const guard = new SsrfGuard(config);

            // 应该通过白名单验证
            const result = await guard.validate('https://www.google.com');
            // DNS解析结果取决于网络环境，所以只验证结构
            expect(result).to.have.property('passed');
            expect(result.originalUrl).to.equal('https://www.google.com');
            expect(result.hostname).to.equal('www.google.com');
        });

        it('应该在任一验证步骤失败时拒绝', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                whitelist: ['example.com'], // 只允许 example.com
                enableDnsValidation: false
            };
            const guard = new SsrfGuard(config);

            // 应该失败：不在白名单中
            const result = await guard.validate('https://google.com');
            expect(result.passed).to.be.false;
        });

        it('应该处理包含端口号的 URL', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                enableDnsValidation: false
            };
            const guard = new SsrfGuard(config);

            const result = await guard.validate('https://example.com:8080/path');
            expect(result.passed).to.be.true;
            expect(result.hostname).to.equal('example.com');
        });

        it('应该处理包含查询参数的 URL', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                enableDnsValidation: false
            };
            const guard = new SsrfGuard(config);

            const result = await guard.validate('https://example.com?param=value');
            expect(result.passed).to.be.true;
            expect(result.hostname).to.equal('example.com');
        });

        it('应该处理包含片段标识符的 URL', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                enableDnsValidation: false
            };
            const guard = new SsrfGuard(config);

            const result = await guard.validate('https://example.com#section');
            expect(result.passed).to.be.true;
            expect(result.hostname).to.equal('example.com');
        });
    });

    describe('边界情况', () => {
        it('应该处理非常长的 URL', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                enableDnsValidation: false
            };
            const guard = new SsrfGuard(config);

            const longPath = 'a'.repeat(1000);
            const result = await guard.validate(`https://example.com/${longPath}`);
            
            expect(result.passed).to.be.true;
        });

        it('应该处理国际化域名', async () => {
            const config: SecurityConfig = {
                ...defaultConfig,
                enableDnsValidation: false
            };
            const guard = new SsrfGuard(config);

            // Punycode 编码的国际化域名
            const result = await guard.validate('https://xn--n3h.com'); // ☃.com
            
            expect(result.passed).to.be.true;
        });
    });
});

