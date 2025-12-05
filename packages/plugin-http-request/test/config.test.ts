/**
 * 配置管理测试
 */

import { expect } from 'chai';
import {
    EClientAdapter,
    mergeConfig,
    validateConfig
} from '../src';


describe('Config', () => {
    describe('mergeConfig', () => {
        it('应该在未提供用户配置时使用默认配置', () => {
            const config = mergeConfig();
            expect(config.adapter).to.equal('axios');
            expect(config.security.enableDnsValidation).to.be.true;
            expect(config.security.enableIpValidation).to.be.true;
            expect(config.security.allowPrivateIp).to.be.false;
            expect(config.security.rejectUnauthorized).to.be.true;
        });

        it('应该将用户配置与默认配置合并', () => {
            const config = mergeConfig({
                adapter: EClientAdapter.undici,
                security: {
                    allowPrivateIp: true
                }
            });

            expect(config.adapter).to.equal(EClientAdapter.undici);
            expect(config.security.allowPrivateIp).to.be.true;
            expect(config.security.enableDnsValidation).to.be.true; // default
        });

        it('应该保留嵌套配置', () => {
            const config = mergeConfig({
                security: {
                    whitelist: ['example.com'],
                    blacklist: ['bad.com']
                }
            });

            expect(config.security.whitelist).to.deep.equal(['example.com']);
            expect(config.security.blacklist).to.deep.equal(['bad.com']);
        });

        it('应该允许自定义安全配置', () => {
            const config = mergeConfig({
                security: {
                    rejectUnauthorized: false
                }
            });

            expect(config.security.rejectUnauthorized).to.be.false;
        });
    });

    describe('validateConfig', () => {
        it('应该接受有效配置', () => {
            const config = mergeConfig();
            expect(() => validateConfig(config)).to.not.throw();
        });

        it('应该拒绝无效的适配器', () => {
            const config = mergeConfig({ adapter: 'invalid' as any });
            expect(() => validateConfig(config)).to.throw(/invalid adapter/i);
        });

        it('应该拒绝负数超时', () => {
            const config = mergeConfig({ request: { timeout: -1 } as any });
            expect(() => validateConfig(config)).to.throw(/timeout/i);
        });

        it('应该拒绝负数重试次数', () => {
            const config = mergeConfig({ request: { retries: -1 } as any });
            expect(() => validateConfig(config)).to.throw(/retries/i);
        });

        it('应该拒绝负数 DNS 缓存 TTL', () => {
            const config = mergeConfig({ security: { dnsCacheTtl: -1 } });
            expect(() => validateConfig(config)).to.throw(/dns cache ttl/i);
        });

        it('应该拒绝超过最大值的 DNS 缓存 TTL（24 小时）', () => {
            const maxTtl = 24 * 60 * 60 * 1000; // 24 hours
            const config = mergeConfig({ security: { dnsCacheTtl: maxTtl + 1 } });
            expect(() => validateConfig(config)).to.throw(/dns cache ttl.*exceed.*24 hours/i);
        });

        it('应该接受最大值的 DNS 缓存 TTL（5 分钟）', () => {
            const maxTtl = 5 * 60 * 1000; // 5 minutes
            const config = mergeConfig({ security: { dnsCacheTtl: maxTtl } });
            expect(() => validateConfig(config)).to.not.throw();
        });
    });
});

