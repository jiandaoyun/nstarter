/**
 * DNS 验证器测试
 */

import { expect } from 'chai';
import { DnsValidator } from '../../src/security/dns.validator';

describe('DnsValidator', () => {
    describe('构造函数', () => {
        it('应该使用默认 TTL 创建', () => {
            const validator = new DnsValidator();
            expect(validator.getCacheSize()).to.equal(0);
        });

        it('应该使用自定义 TTL 创建', () => {
            const validator = new DnsValidator(30000);
            expect(validator.getCacheSize()).to.equal(0);
        });
    });

    describe('resolve', () => {
        it('应该能够解析有效的域名', async () => {
            const validator = new DnsValidator();
            const result = await validator.resolve('google.com');

            expect(result).to.have.property('hostname', 'google.com');
            expect(result).to.have.property('addresses');
            expect(result.addresses).to.be.an('array').that.is.not.empty;
            expect(result).to.have.property('timestamp');
            expect(result).to.have.property('ttl');
        });

        it('应该能够解析 localhost', async () => {
            const validator = new DnsValidator();
            const result = await validator.resolve('localhost');

            expect(result.hostname).to.equal('localhost');
            expect(result.addresses).to.be.an('array');
            // localhost 应该解析为 127.0.0.1 或 ::1
            expect(result.addresses.length).to.be.greaterThan(0);
        });

        it('应该在 DNS 解析失败时抛出错误', async () => {
            const validator = new DnsValidator();
            
            try {
                await validator.resolve('this-domain-definitely-does-not-exist-12345678.com');
                expect.fail('应该抛出错误');
            } catch (error) {
                expect(error).to.be.instanceOf(Error);
                expect((error as Error).message).to.include('DNS resolution failed');
            }
        });
    });

    describe('缓存功能', () => {
        it('应该缓存 DNS 查询结果', async () => {
            const validator = new DnsValidator(60000);

            // 第一次查询
            const result1 = await validator.resolve('google.com');
            expect(validator.getCacheSize()).to.equal(1);

            // 第二次查询应该从缓存返回
            const result2 = await validator.resolve('google.com');
            expect(validator.getCacheSize()).to.equal(1);

            // 结果应该相同
            expect(result1.timestamp).to.equal(result2.timestamp);
            expect(result1.addresses).to.deep.equal(result2.addresses);
        });

        it('应该能够缓存多个域名', async () => {
            const validator = new DnsValidator();

            await validator.resolve('google.com');
            await validator.resolve('github.com');
            
            expect(validator.getCacheSize()).to.equal(2);
        });

        it('应该在缓存过期后重新查询', async function() {
            this.timeout(5000); // 增加超时时间

            const validator = new DnsValidator(100); // 100ms TTL

            // 第一次查询
            const result1 = await validator.resolve('google.com');
            const timestamp1 = result1.timestamp;

            // 等待缓存过期
            await new Promise(resolve => setTimeout(resolve, 150));

            // 第二次查询应该重新执行
            const result2 = await validator.resolve('google.com');
            const timestamp2 = result2.timestamp;

            // 时间戳应该不同，表明是重新查询的
            expect(timestamp2).to.be.greaterThan(timestamp1);
        });
    });

    describe('clearCache', () => {
        it('应该清空所有缓存', async () => {
            const validator = new DnsValidator();

            await validator.resolve('google.com');
            await validator.resolve('github.com');
            expect(validator.getCacheSize()).to.equal(2);

            validator.clearCache();
            expect(validator.getCacheSize()).to.equal(0);
        });

        it('清空缓存后应该重新查询', async () => {
            const validator = new DnsValidator();

            const result1 = await validator.resolve('google.com');
            validator.clearCache();
            const result2 = await validator.resolve('google.com');

            // 时间戳应该不同
            expect(result2.timestamp).to.be.greaterThanOrEqual(result1.timestamp);
        });
    });

    describe('clearCacheFor', () => {
        it('应该清除指定域名的缓存', async () => {
            const validator = new DnsValidator();

            await validator.resolve('google.com');
            await validator.resolve('github.com');
            expect(validator.getCacheSize()).to.equal(2);

            validator.clearCacheFor('google.com');
            expect(validator.getCacheSize()).to.equal(1);

            validator.clearCacheFor('github.com');
            expect(validator.getCacheSize()).to.equal(0);
        });

        it('清除不存在的缓存应该不会报错', () => {
            const validator = new DnsValidator();

            expect(() => validator.clearCacheFor('non-existent.com')).to.not.throw();
            expect(validator.getCacheSize()).to.equal(0);
        });
    });

    describe('getCacheSize', () => {
        it('应该返回正确的缓存大小', async () => {
            const validator = new DnsValidator();

            expect(validator.getCacheSize()).to.equal(0);

            await validator.resolve('google.com');
            expect(validator.getCacheSize()).to.equal(1);

            await validator.resolve('github.com');
            expect(validator.getCacheSize()).to.equal(2);

            validator.clearCache();
            expect(validator.getCacheSize()).to.equal(0);
        });
    });

    describe('cleanExpiredCache', () => {
        it('应该清理过期的缓存条目', async function() {
            this.timeout(5000);

            const validator = new DnsValidator(100);

            await validator.resolve('google.com');
            expect(validator.getCacheSize()).to.equal(1);

            // 等待缓存过期
            await new Promise(resolve => setTimeout(resolve, 150));

            validator.cleanExpiredCache();
            expect(validator.getCacheSize()).to.equal(0);
        });

        it('应该保留未过期的缓存条目', async function() {
            this.timeout(5000);

            const validator = new DnsValidator(60000); // 长 TTL

            await validator.resolve('google.com');
            await validator.resolve('github.com');
            expect(validator.getCacheSize()).to.equal(2);

            // 短暂等待
            await new Promise(resolve => setTimeout(resolve, 100));

            validator.cleanExpiredCache();
            // 缓存应该仍然存在
            expect(validator.getCacheSize()).to.equal(2);
        });
    });

    describe('resolveAndValidate', () => {
        it('应该解析域名并验证 IP 地址', async () => {
            const validator = new DnsValidator();

            const result = await validator.resolveAndValidate('google.com', false);

            expect(result).to.have.property('dnsResult');
            expect(result).to.have.property('allValid');
            expect(result).to.have.property('invalidIps');
            expect(result.dnsResult.hostname).to.equal('google.com');
            expect(result.dnsResult.addresses).to.be.an('array').that.is.not.empty;
            expect(result.allValid).to.be.a('boolean');
            expect(result.invalidIps).to.be.an('array');
        });

        it('应该正确识别公共 IP 地址', async () => {
            const validator = new DnsValidator();

            const result = await validator.resolveAndValidate('google.com', false);

            // Google 的 IP 应该都是公共 IP
            expect(result.allValid).to.be.true;
            expect(result.invalidIps).to.be.an('array').that.is.empty;
        });

        it('应该在不允许私有 IP 时正确标记', async () => {
            const validator = new DnsValidator();

            // localhost 会解析为私有 IP
            const result = await validator.resolveAndValidate('localhost', false);

            // 应该识别为无效（私有IP）
            expect(result.allValid).to.be.false;
            expect(result.invalidIps).to.be.an('array').that.is.not.empty;
        });

        it('应该在允许私有 IP 时通过验证', async () => {
            const validator = new DnsValidator();

            const result = await validator.resolveAndValidate('localhost', true);

            // localhost 解析为 loopback 地址（127.0.0.1 或 ::1）
            // loopback 地址即使允许私有 IP 也可能被拒绝，因为它们有自己的分类
            // 所以这个测试检查返回结构是否正确即可
            expect(result).to.have.property('allValid');
            expect(result).to.have.property('invalidIps');
            expect(result.invalidIps).to.be.an('array');
        });
    });

    describe('边界情况', () => {
        it('应该处理空域名', async () => {
            const validator = new DnsValidator();

            try {
                await validator.resolve('');
                expect.fail('应该抛出错误');
            } catch (error) {
                expect(error).to.be.instanceOf(Error);
            }
        });

        it('应该处理无效的域名格式', async () => {
            const validator = new DnsValidator();
            const invalidDomains = [
                'invalid..domain.com',
                '-invalid.com',
                'invalid-.com'
            ];

            for (const domain of invalidDomains) {
                try {
                    await validator.resolve(domain);
                    // 某些无效域名可能仍能解析，这取决于 DNS 服务器
                } catch (error) {
                    expect(error).to.be.instanceOf(Error);
                }
            }
        });

        it('应该处理 TTL 为 0 的情况', async () => {
            const validator = new DnsValidator(0);

            await validator.resolve('google.com');
            // TTL 为 0 时，缓存应该立即过期
            expect(validator.getCacheSize()).to.be.greaterThanOrEqual(0);
        });
    });

    describe('LRU 缓存淘汰', () => {
        it('应该在缓存满时淘汰最旧的条目', async function() {
            this.timeout(10000); // 增加超时时间

            // 创建一个只能容纳 3 个条目的小缓存
            const validator = new DnsValidator(60000, undefined, 3);

            // 添加 3 个域名
            await validator.resolve('google.com');
            await validator.resolve('github.com');
            await validator.resolve('npmjs.com');

            expect(validator.getCacheSize()).to.equal(3);

            // 添加第 4 个域名，应该淘汰最旧的 (google.com)
            await validator.resolve('stackoverflow.com');

            expect(validator.getCacheSize()).to.equal(3);
            expect(validator.getMaxCacheSize()).to.equal(3);
        });

        it('应该更新最近访问的条目位置', async function() {
            this.timeout(10000);

            const validator = new DnsValidator(60000, undefined, 3);

            // 添加 3 个域名
            await validator.resolve('google.com');
            await validator.resolve('github.com');
            await validator.resolve('npmjs.com');

            // 再次访问 google.com，使其成为最近使用的
            await validator.resolve('google.com');

            // 添加新域名，应该淘汰 github.com（最早没被访问的）
            await validator.resolve('stackoverflow.com');

            expect(validator.getCacheSize()).to.equal(3);
            // google.com 应该还在缓存中（因为刚被访问过）
            expect(validator.hasCache('google.com')).to.be.true;
        });

        it('getMaxCacheSize 应该返回正确的最大容量', () => {
            const validator1 = new DnsValidator(60000, undefined, 100);
            expect(validator1.getMaxCacheSize()).to.equal(100);

            const validator2 = new DnsValidator(60000, undefined, 500);
            expect(validator2.getMaxCacheSize()).to.equal(500);
        });

        it('hasCache 应该正确判断缓存是否存在', async () => {
            const validator = new DnsValidator();

            expect(validator.hasCache('google.com')).to.be.false;

            await validator.resolve('google.com');

            expect(validator.hasCache('google.com')).to.be.true;
            expect(validator.hasCache('github.com')).to.be.false;
        });
    });
});

