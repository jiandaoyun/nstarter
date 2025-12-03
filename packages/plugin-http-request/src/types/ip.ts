/**
 * IP 相关类型定义
 */

/**
 * 预编译的 IPv4 CIDR 范围
 */
export interface CompiledIpv4Range {
    /** 网络地址（数字形式） */
    network: number;
    /** 子网掩码（数字形式） */
    mask: number;
    /** 原始 CIDR 字符串 */
    cidr: string;
}

/**
 * 预编译的 IPv6 CIDR 范围
 */
export interface CompiledIpv6Range {
    /** 网络地址高 64 位 */
    networkHigh: bigint;
    /** 网络地址低 64 位 */
    networkLow: bigint;
    /** 子网掩码高 64 位 */
    maskHigh: bigint;
    /** 子网掩码低 64 位 */
    maskLow: bigint;
    /** CIDR 前缀长度 */
    prefix: number;
    /** 原始 CIDR 字符串 */
    cidr: string;
}

