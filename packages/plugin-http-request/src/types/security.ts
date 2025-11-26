/**
 * 安全和验证相关类型定义
 */

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

