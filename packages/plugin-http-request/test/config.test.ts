/**
 * 配置管理测试
 */

import { expect } from 'chai';
import {
    EHttpRequestClientAdapter,
    mergeConfig,
    validateConfig
} from '../src';


describe('Config', () => {
    describe('mergeConfig', () => {
        it('should use default config when no user config provided', () => {
            const config = mergeConfig();
            expect(config.adapter).to.equal('axios');
            expect(config.security.enableDnsValidation).to.be.true;
            expect(config.security.enableIpValidation).to.be.true;
            expect(config.security.allowPrivateIp).to.be.false;
            expect(config.security.rejectUnauthorized).to.be.true;
        });

        it('should merge user config with defaults', () => {
            const config = mergeConfig({
                adapter: EHttpRequestClientAdapter.undici,
                security: {
                    allowPrivateIp: true
                }
            });

            expect(config.adapter).to.equal(EHttpRequestClientAdapter.undici);
            expect(config.security.allowPrivateIp).to.be.true;
            expect(config.security.enableDnsValidation).to.be.true; // default
        });

        it('should preserve nested config', () => {
            const config = mergeConfig({
                security: {
                    whitelist: ['example.com'],
                    blacklist: ['bad.com']
                }
            });

            expect(config.security.whitelist).to.deep.equal(['example.com']);
            expect(config.security.blacklist).to.deep.equal(['bad.com']);
        });

        it('should allow custom security config', () => {
            const config = mergeConfig({
                security: {
                    rejectUnauthorized: false
                }
            });

            expect(config.security.rejectUnauthorized).to.be.false;
        });
    });

    describe('validateConfig', () => {
        it('should accept valid config', () => {
            const config = mergeConfig();
            expect(() => validateConfig(config)).to.not.throw();
        });

        it('should reject invalid adapter', () => {
            const config = mergeConfig({ adapter: 'invalid' as any });
            expect(() => validateConfig(config)).to.throw(/invalid adapter/i);
        });

        it('should reject negative timeout', () => {
            const config = mergeConfig({ request: { timeout: -1 } as any });
            expect(() => validateConfig(config)).to.throw(/timeout/i);
        });

        it('should reject negative retries', () => {
            const config = mergeConfig({ request: { retries: -1 } as any });
            expect(() => validateConfig(config)).to.throw(/retries/i);
        });

        it('should reject negative DNS cache TTL', () => {
            const config = mergeConfig({ security: { dnsCacheTtl: -1 } });
            expect(() => validateConfig(config)).to.throw(/dns cache ttl/i);
        });

        it('should reject DNS cache TTL exceeding maximum (24 hours)', () => {
            const maxTtl = 24 * 60 * 60 * 1000; // 24 hours
            const config = mergeConfig({ security: { dnsCacheTtl: maxTtl + 1 } });
            expect(() => validateConfig(config)).to.throw(/dns cache ttl.*exceed.*24 hours/i);
        });

        it('should accept DNS cache TTL at maximum (24 hours)', () => {
            const maxTtl = 24 * 60 * 60 * 1000; // 24 hours
            const config = mergeConfig({ security: { dnsCacheTtl: maxTtl } });
            expect(() => validateConfig(config)).to.not.throw();
        });
    });
});

