/**
 * IP 地址范围工具
 */

import type {
    CompiledIpv4Range,
    CompiledIpv6Range
} from '../types';

/**
 * 将 IPv4 地址转换为数字
 */
export function ipv4ToNumber(ip: string): number {
    const parts = ip.split('.');
    return (
        (parseInt(parts[0], 10) << 24) +
        (parseInt(parts[1], 10) << 16) +
        (parseInt(parts[2], 10) << 8) +
        parseInt(parts[3], 10)
    ) >>> 0; // 无符号右移确保为正数
}

/**
 * 预编译 IPv4 CIDR 范围
 * @param cidr CIDR 表示法，如 "192.168.0.0/16"
 */
export function compileIpv4Range(cidr: string): CompiledIpv4Range {
    const [network, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);

    if (prefix < 0 || prefix > 32) {
        throw new Error(`Invalid CIDR prefix: ${ prefix }`);
    }

    const networkNum = ipv4ToNumber(network);
    const mask = (0xffffffff << (32 - prefix)) >>> 0;

    return {
        network: networkNum & mask,
        mask,
        cidr
    };
}

/**
 * 检查 IPv4 地址是否在预编译的范围内（高性能版本）
 * @param ip IP 地址
 * @param compiledRange 预编译的范围
 */
export function isIpv4InCompiledRange(ip: string, compiledRange: CompiledIpv4Range): boolean {
    const ipNum = ipv4ToNumber(ip);
    return (ipNum & compiledRange.mask) === compiledRange.network;
}

/**
 * 将 IPv6 地址转换为 BigInt 数组（高 64 位和低 64 位）
 */
export function ipv6ToBigInt(ip: string): [bigint, bigint] {
    // 标准化 IPv6 地址
    const normalized = normalizeIpv6(ip);
    const parts = normalized.split(':');

    let high = BigInt(0);
    let low = BigInt(0);

    for (let i = 0; i < 4; i++) {
        high = (high << BigInt(16)) | BigInt(parseInt(parts[i], 16));
    }

    for (let i = 4; i < 8; i++) {
        low = (low << BigInt(16)) | BigInt(parseInt(parts[i], 16));
    }

    return [high, low];
}

/**
 * 标准化 IPv6 地址（展开缩写）
 */
export function normalizeIpv6(ip: string): string {
    // 移除区域 ID（如 fe80::1%eth0 中的 %eth0）
    const cleaned = ip.split('%')[0];

    // 处理 :: 缩写
    const parts = cleaned.split(':');
    const filled: string[] = [];

    let doubleColonIndex = -1;
    for (let i = 0; i < parts.length; i++) {
        if (parts[i] === '') {
            if (doubleColonIndex === -1) {
                doubleColonIndex = i;
            }
        } else {
            filled.push(parts[i].padStart(4, '0'));
        }
    }

    // 填充 :: 省略的部分
    if (doubleColonIndex !== -1) {
        const missing = 8 - filled.length;
        const before = filled.slice(0, doubleColonIndex === 0 ? 0 : doubleColonIndex);
        const after = filled.slice(doubleColonIndex === 0 ? 0 : doubleColonIndex);
        const zeros = Array(missing).fill('0000');
        return [...before, ...zeros, ...after].join(':');
    }

    return filled.join(':');
}

/**
 * 预编译 IPv6 CIDR 范围
 * @param cidr CIDR 表示法，如 "fe80::/10"
 */
export function compileIpv6Range(cidr: string): CompiledIpv6Range {
    const [network, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);

    if (prefix < 0 || prefix > 128) {
        throw new Error(`Invalid IPv6 CIDR prefix: ${ prefix }`);
    }

    const [netHigh, netLow] = ipv6ToBigInt(network);

    let maskHigh: bigint;
    let maskLow: bigint;

    if (prefix <= 64) {
        // 只需要掩码高 64 位
        maskHigh = (BigInt(0xffffffffffffffffn) << BigInt(64 - prefix)) & BigInt(0xffffffffffffffffn);
        maskLow = BigInt(0);
    } else {
        // 高 64 位全部掩码，低 64 位部分掩码
        maskHigh = BigInt(0xffffffffffffffffn);
        maskLow = (BigInt(0xffffffffffffffffn) << BigInt(128 - prefix)) & BigInt(0xffffffffffffffffn);
    }

    return {
        networkHigh: netHigh & maskHigh,
        networkLow: netLow & maskLow,
        maskHigh,
        maskLow,
        prefix,
        cidr
    };
}

/**
 * 检查 IPv6 地址是否在预编译的范围内（高性能版本）
 * @param ip IPv6 地址
 * @param compiledRange 预编译的范围
 */
export function isIpv6InCompiledRange(ip: string, compiledRange: CompiledIpv6Range): boolean {
    const [ipHigh, ipLow] = ipv6ToBigInt(ip);

    if (compiledRange.prefix <= 64) {
        // 只需要比较高 64 位
        return (ipHigh & compiledRange.maskHigh) === compiledRange.networkHigh;
    } else {
        // 高 64 位必须完全匹配，低 64 位部分匹配
        return (ipHigh & compiledRange.maskHigh) === compiledRange.networkHigh &&
            (ipLow & compiledRange.maskLow) === compiledRange.networkLow;
    }
}

/**
 * 批量预编译 IPv4 CIDR 范围列表
 * @param cidrs CIDR 范围列表
 */
export function compileIpv4Ranges(cidrs: string[]): CompiledIpv4Range[] {
    return cidrs.map(cidr => compileIpv4Range(cidr));
}

/**
 * 批量预编译 IPv6 CIDR 范围列表
 * @param cidrs CIDR 范围列表
 */
export function compileIpv6Ranges(cidrs: string[]): CompiledIpv6Range[] {
    return cidrs.map(cidr => compileIpv6Range(cidr));
}

/**
 * 检查 IPv4 地址是否匹配任一预编译范围（高性能版本）
 * @param ip IPv4 地址
 * @param compiledRanges 预编译的范围列表
 */
export function isIpv4InAnyCompiledRange(ip: string, compiledRanges: CompiledIpv4Range[]): boolean {
    const ipNum = ipv4ToNumber(ip);
    for (const range of compiledRanges) {
        if ((ipNum & range.mask) === range.network) {
            return true;
        }
    }
    return false;
}

/**
 * 检查 IPv6 地址是否匹配任一预编译范围（高性能版本）
 * @param ip IPv6 地址
 * @param compiledRanges 预编译的范围列表
 */
export function isIpv6InAnyCompiledRange(ip: string, compiledRanges: CompiledIpv6Range[]): boolean {
    const [ipHigh, ipLow] = ipv6ToBigInt(ip);
    for (const range of compiledRanges) {
        if (range.prefix <= 64) {
            if ((ipHigh & range.maskHigh) === range.networkHigh) {
                return true;
            }
        } else {
            if ((ipHigh & range.maskHigh) === range.networkHigh &&
                (ipLow & range.maskLow) === range.networkLow) {
                return true;
            }
        }
    }
    return false;
}

