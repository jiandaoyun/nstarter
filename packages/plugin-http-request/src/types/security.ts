/**
 * 安全和验证相关类型定义
 */

import type { SecurityConfig } from './config';

/**
 * DNS 解析结果
 */
export interface DnsResult {
    /** 域名 */
    hostname: string;
    /** 解析到的 IP 地址列表 */
    addresses: string[];
    /** 解析时间戳 */
    timestamp: number;
    /** TTL */
    ttl: number;
}

/**
 * IP 验证结果
 */
export interface IpValidationResult {
    /** 是否有效 */
    valid: boolean;
    /** IP 地址 */
    ip: string;
    /** 是否为私有 IP */
    isPrivate: boolean;
    /** 是否为回环地址 */
    isLoopback: boolean;
    /** 是否为 Link-Local */
    isLinkLocal: boolean;
    /** 是否为组播地址 */
    isMulticast: boolean;
    /** 是否为保留地址 */
    isReserved: boolean;
    /** 原因（当 valid 为 false 时） */
    reason?: string;
}

/**
 * URL 验证结果
 */
export interface UrlValidationResult {
    /** 是否有效 */
    valid: boolean;
    /** URL */
    url: string;
    /** 是否在白名单中 */
    inWhitelist: boolean;
    /** 是否在黑名单中 */
    inBlacklist: boolean;
    /** 原因（当 valid 为 false 时） */
    reason?: string;
}


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
 * SSRF 防护接口
 */
export interface ISsrfGuard {
    /**
     * 验证 URL 是否安全
     * @param url 要验证的 URL
     * @returns 验证结果
     */
    validate: (url: string) => Promise<SsrfGuardResult>;

    /**
     * 验证并返回安全的 URL
     * @param url 要验证的 URL
     * @returns 安全的 URL 和验证结果
     * @throws {SecurityError} 验证失败时抛出错误
     */
    validateAndGetSafeUrl: (url: string) => Promise<{ safeUrl: string, result: SsrfGuardResult }>;

    /**
     * 更新配置
     * @param config 新的安全配置
     */
    updateConfig: (config: Partial<SecurityConfig>) => void;

    /**
     * 清空 DNS 缓存
     */
    clearDnsCache: () => void;

    /**
     * 获取 DNS 缓存大小
     * @returns 缓存条目数量
     */
    getDnsCacheSize: () => number;

    /**
     * 清理过期的 DNS 缓存
     */
    cleanExpiredDnsCache: () => void;

    /**
     * 获取当前配置
     * @returns 安全配置副本
     */
    getConfig: () => SecurityConfig;
}


