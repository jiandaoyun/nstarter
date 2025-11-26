/**
 * DNS 验证器
 */

import { promises as dns } from 'node:dns';
import type {
    DnsCacheEntry,
    DnsResult
} from '../types';
import { IpValidator } from './ip.validator';


/**
 * DNS 验证器类
 */
export class DnsValidator {
    private cache: Map<string, DnsCacheEntry> = new Map();
    private cacheTtl: number;

    constructor(cacheTtl = 60000) {
        this.cacheTtl = cacheTtl;
    }

    /**
     * 解析域名
     * @param hostname 域名
     * @returns DNS 解析结果
     */
    public async resolve(hostname: string): Promise<DnsResult> {
        // 检查缓存
        const cached = this.getFromCache(hostname);
        if (cached) {
            return cached;
        }

        try {
            // 尝试解析 IPv4 和 IPv6
            const addresses: string[] = [];

            try {
                const ipv4Addresses = await dns.resolve4(hostname);
                addresses.push(...ipv4Addresses);
            } catch {
                // IPv4 解析失败，继续尝试 IPv6
            }

            try {
                const ipv6Addresses = await dns.resolve6(hostname);
                addresses.push(...ipv6Addresses);
            } catch {
                // IPv6 解析失败
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

            // 存入缓存
            this.setCache(hostname, result);

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
     * 从缓存获取 DNS 结果
     * @param hostname 域名
     * @returns DNS 结果或 null
     */
    private getFromCache(hostname: string): DnsResult | null {
        const entry = this.cache.get(hostname);
        if (!entry) {
            return null;
        }

        // 检查是否过期
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(hostname);
            return null;
        }

        return entry.result;
    }

    /**
     * 设置缓存
     * @param hostname 域名
     * @param result DNS 结果
     */
    private setCache(hostname: string, result: DnsResult): void {
        this.cache.set(hostname, {
            result,
            expiresAt: Date.now() + this.cacheTtl
        });
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
     * 设置缓存 TTL
     * @param ttl TTL（毫秒）
     */
    public setCacheTtl(ttl: number): void {
        this.cacheTtl = ttl;
    }

    /**
     * 清理过期的缓存条目
     */
    public cleanExpiredCache(): void {
        const now = Date.now();
        for (const [hostname, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(hostname);
            }
        }
    }
}

