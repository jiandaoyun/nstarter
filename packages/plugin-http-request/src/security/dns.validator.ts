/**
 * DNS 验证器
 */

import { promises as dns } from 'node:dns';
import { LRUCache } from 'lru-cache';
import { CommonUtils } from '../utils';
import {
    DEFAULT_DNS_CACHE_TTL,
    DEFAULT_DNS_RESOLVE_TIMEOUT,
    DEFAULT_DNS_CACHE_MAX_SIZE
} from '../const';
import type {
    DnsResult
} from '../types';
import { IpValidator } from './ip.validator';


/**
 * DNS 验证器类
 */
export class DnsValidator {
    private cache: LRUCache<string, DnsResult>;
    private cacheTtl: number;
    private resolveTimeout: number;

    constructor(
        cacheTtl = DEFAULT_DNS_CACHE_TTL,
        resolveTimeout = DEFAULT_DNS_RESOLVE_TIMEOUT,
        maxCacheSize = DEFAULT_DNS_CACHE_MAX_SIZE
    ) {
        this.cacheTtl = cacheTtl;
        this.resolveTimeout = resolveTimeout;
        this.cache = new LRUCache<string, DnsResult>({
            max: maxCacheSize,
            ttl: cacheTtl,
            // 启用 TTL 自动清理
            ttlAutopurge: true,
            // 更新访问时间，实现真正的 LRU
            updateAgeOnGet: true,
            // 更新访问时间时也更新 has() 调用
            updateAgeOnHas: true,
        });
    }

    /**
     * 解析域名
     * @param hostname 域名
     * @returns DNS 解析结果
     */
    public async resolve(hostname: string): Promise<DnsResult> {
        // 检查缓存
        const cached = this.cache.get(hostname);
        if (cached) {
            return cached;
        }

        try {
            // 尝试解析 IPv4 和 IPv6
            const addresses: string[] = [];

            try {
                const ipv4Addresses = await CommonUtils.withTimeout(dns.resolve4(hostname), this.resolveTimeout, 'DNS resolution timed out');
                addresses.push(...ipv4Addresses);
            } catch {
                // IPv4 解析失败，继续尝试 IPv6
            }

            try {
                const ipv6Addresses = await CommonUtils.withTimeout(dns.resolve6(hostname), this.resolveTimeout, 'DNS resolution timed out');
                addresses.push(...ipv6Addresses);
            } catch {
                // IPv6 解析失败
            }

            // resolve4/resolve6 不拼接 search 域，在 ACK 等带集群后缀的环境会 ENOTFOUND；
            // 失败时回退到 lookup（走 getaddrinfo，会按 resolv.conf 拼 search），与建连时行为一致
            if (addresses.length === 0) {
                try {
                    const lookupResult = await CommonUtils.withTimeout(
                        dns.lookup(hostname, { all: true }),
                        this.resolveTimeout,
                        'DNS lookup timed out'
                    );
                    for (const { address } of lookupResult) {
                        addresses.push(address);
                    }
                } catch {
                    // lookup 也失败，下面统一抛错
                }
            }

            if (addresses.length === 0) {
                throw new Error(`Unable to resolve hostname: ${ hostname }`);
            }

            const result: DnsResult = {
                hostname,
                addresses,
                timestamp: Date.now(),
                ttl: this.cacheTtl
            };

            // 存入缓存，LRUCache 会自动处理 TTL 和容量限制
            this.cache.set(hostname, result);

            return result;
        } catch (error) {
            throw new Error(
                `DNS resolution failed for ${ hostname }: ${ error instanceof Error ? error.message : String(error) }`
            );
        }
    }


    /**
     * 解析并验证域名（包括 IP 安全检查）
     * @param hostname 域名
     * @param allowPrivateIp 是否允许私有 IP
     * @returns DNS 解析结果和验证结果
     */
    public async resolveAndValidate(
        hostname: string,
        allowPrivateIp = false
    ): Promise<{ dnsResult: DnsResult, allValid: boolean, invalidIps: string[] }> {
        const dnsResult = await this.resolve(hostname);
        const validationResults = IpValidator.validateMany(dnsResult.addresses, allowPrivateIp);

        const invalidIps = validationResults
            .filter(result => !result.valid)
            .map(result => result.ip);

        return {
            dnsResult,
            allValid: invalidIps.length === 0,
            invalidIps
        };
    }

    /**
     * 清空缓存
     */
    public clearCache(): void {
        this.cache.clear();
    }

    /**
     * 清除指定域名的缓存
     * @param hostname 域名
     */
    public clearCacheFor(hostname: string): void {
        this.cache.delete(hostname);
    }

    /**
     * 获取缓存大小
     * @returns 缓存条目数量
     */
    public getCacheSize(): number {
        return this.cache.size;
    }

    /**
     * 清理过期的缓存条目
     * LRUCache 会自动清理过期条目（ttlAutopurge: true），此方法主动触发清理
     */
    public cleanExpiredCache(): void {
        this.cache.purgeStale();
    }

    /**
     * 获取缓存的最大容量
     * @returns 最大缓存条目数量
     */
    public getMaxCacheSize(): number {
        return this.cache.max;
    }

    /**
     * 检查缓存中是否存在指定域名
     * @param hostname 域名
     * @returns 是否存在
     */
    public hasCache(hostname: string): boolean {
        return this.cache.has(hostname);
    }
}
