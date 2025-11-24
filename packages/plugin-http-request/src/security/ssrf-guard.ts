/**
 * SSRF 防护
 * 整合 IP、DNS 和 URL 验证，防止服务器端请求伪造攻击
 */

import { URL } from 'node:url';
import { isIP } from 'node:net';
import type {
    SecurityConfig,
} from '../types';
import { SecurityError } from '../types';
import { DnsValidator } from './dns-validator';
import { IpValidator } from './ip-validator';
import { UrlValidator } from './url-validator';

/**
 * SSRF 防护结果
 */
export interface SsrfGuardResult {
    /** 是否通过验证 */
    passed: boolean;
    /** 原始 URL */
    originalUrl: string;
    /** 解析后的主机名 */
    hostname: string;
    /** 解析后的 IP 地址列表（如果进行了 DNS 解析） */
    resolvedIps?: string[];
    /** 安全的 IP 地址（如果进行了 DNS 解析且通过验证） */
    safeIp?: string;
    /** 失败原因 */
    reason?: string;
}

/**
 * SSRF 防护类
 */
export class SsrfGuard {
    private dnsValidator: DnsValidator;
    private urlValidator: UrlValidator;
    private config: SecurityConfig;

    constructor(config: SecurityConfig) {
        this.config = config;
        this.dnsValidator = new DnsValidator(config.dnsCacheTtl);
        this.urlValidator = new UrlValidator(config.whitelist, config.blacklist);
    }

    /**
     * 验证 URL 是否安全
     * @param url 要验证的 URL
     * @returns 验证结果
     */
    public async validate(url: string): Promise<SsrfGuardResult> {
        let parsedUrl: URL;

        try {
            parsedUrl = new URL(url);
        } catch (error) {
            return {
                passed: false,
                originalUrl: url,
                hostname: '',
                reason: 'Invalid URL format'
            };
        }

        const hostname = parsedUrl.hostname;

        // 第一步：URL 验证（黑白名单）
        const urlValidation = this.urlValidator.validate(url);
        if (!urlValidation.valid) {
            return {
                passed: false,
                originalUrl: url,
                hostname,
                reason: urlValidation.reason
            };
        }

        // 第二步：检查是否为 IP 地址
        const ipVersion = isIP(hostname);
        if (ipVersion !== 0) {
            // 直接使用 IP 地址，需要验证 IP 安全性
            if (!this.config.enableIpValidation) {
                return {
                    passed: true,
                    originalUrl: url,
                    hostname,
                    resolvedIps: [hostname],
                    safeIp: hostname
                };
            }

            const ipValidation = IpValidator.validate(hostname, this.config.allowPrivateIp);
            if (!ipValidation.valid) {
                return {
                    passed: false,
                    originalUrl: url,
                    hostname,
                    resolvedIps: [hostname],
                    reason: ipValidation.reason
                };
            }

            return {
                passed: true,
                originalUrl: url,
                hostname,
                resolvedIps: [hostname],
                safeIp: hostname
            };
        }

        // 第三步：DNS 解析和验证
        if (!this.config.enableDnsValidation) {
            return {
                passed: true,
                originalUrl: url,
                hostname
            };
        }

        try {
            const { dnsResult, allValid, invalidIps } = await this.dnsValidator.resolveAndValidate(
                hostname,
                this.config.allowPrivateIp
            );

            if (!allValid) {
                return {
                    passed: false,
                    originalUrl: url,
                    hostname,
                    resolvedIps: dnsResult.addresses,
                    reason: `DNS resolved to unsafe IP addresses: ${ invalidIps.join(', ') }`
                };
            }

            // 选择第一个有效的 IP 地址
            const safeIp = dnsResult.addresses[0];

            return {
                passed: true,
                originalUrl: url,
                hostname,
                resolvedIps: dnsResult.addresses,
                safeIp
            };
        } catch (error) {
            return {
                passed: false,
                originalUrl: url,
                hostname,
                reason: error instanceof Error ? error.message : String(error)
            };
        }
    }

    /**
     * 验证并返回安全的 URL（使用解析后的 IP 替换主机名，防止 DNS 重绑定）
     * @param url 要验证的 URL
     * @returns 安全的 URL 和验证结果
     * @throws {SecurityError} 验证失败时抛出错误
     */
    public async validateAndGetSafeUrl(url: string): Promise<{ safeUrl: string, result: SsrfGuardResult }> {
        const result = await this.validate(url);

        if (!result.passed) {
            throw new SecurityError(
                result.reason || 'URL validation failed',
                'SSRF_VALIDATION_FAILED',
                url
            );
        }

        // 如果有解析后的安全 IP，使用 IP 替换域名（防止 DNS 重绑定）
        if (result.safeIp && result.hostname !== result.safeIp) {
            const parsedUrl = new URL(url);

            // 保存原始 Host 头（某些服务器需要）
            const originalHost = parsedUrl.hostname;

            // 替换主机名为 IP
            parsedUrl.hostname = result.safeIp;

            return {
                safeUrl: parsedUrl.toString(),
                result: {
                    ...result,
                    // 附加原始主机名信息，调用者可以用于设置 Host 头
                    originalHost
                } as any
            };
        }

        return {
            safeUrl: url,
            result
        };
    }

    /**
     * 更新配置
     * @param config 新的安全配置
     */
    public updateConfig(config: Partial<SecurityConfig>): void {
        this.config = { ...this.config, ...config };

        if (config.dnsCacheTtl !== undefined) {
            this.dnsValidator.setCacheTtl(config.dnsCacheTtl);
        }

        if (config.whitelist !== undefined || config.blacklist !== undefined) {
            this.urlValidator = new UrlValidator(
                config.whitelist ?? this.config.whitelist,
                config.blacklist ?? this.config.blacklist
            );
        }
    }

    /**
     * 清空 DNS 缓存
     */
    public clearDnsCache(): void {
        this.dnsValidator.clearCache();
    }

    /**
     * 获取 DNS 缓存大小
     * @returns 缓存条目数量
     */
    public getDnsCacheSize(): number {
        return this.dnsValidator.getCacheSize();
    }

    /**
     * 清理过期的 DNS 缓存
     */
    public cleanExpiredDnsCache(): void {
        this.dnsValidator.cleanExpiredCache();
    }

    /**
     * 获取当前配置
     * @returns 安全配置副本
     */
    public getConfig(): SecurityConfig {
        return { ...this.config };
    }
}

