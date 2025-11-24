/**
 * IP 地址范围工具
 */

import {
    isIPv4,
    isIPv6
} from 'node:net';

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
 * 检查 IPv4 地址是否在指定范围内
 * @param ip IP 地址
 * @param cidr CIDR 表示法，如 "192.168.0.0/16"
 */
export function isIpv4InRange(ip: string, cidr: string): boolean {
    const [network, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);

    if (prefix < 0 || prefix > 32) {
        throw new Error(`Invalid CIDR prefix: ${ prefix }`);
    }

    const ipNum = ipv4ToNumber(ip);
    const networkNum = ipv4ToNumber(network);
    const mask = (0xffffffff << (32 - prefix)) >>> 0;

    return (ipNum & mask) === (networkNum & mask);
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
 * 检查 IPv6 地址是否在指定范围内
 * @param ip IPv6 地址
 * @param cidr CIDR 表示法，如 "fe80::/10"
 */
export function isIpv6InRange(ip: string, cidr: string): boolean {
    const [network, prefixStr] = cidr.split('/');
    const prefix = parseInt(prefixStr, 10);

    if (prefix < 0 || prefix > 128) {
        throw new Error(`Invalid IPv6 CIDR prefix: ${ prefix }`);
    }

    const [ipHigh, ipLow] = ipv6ToBigInt(ip);
    const [netHigh, netLow] = ipv6ToBigInt(network);

    if (prefix <= 64) {
        // 只需要比较高 64 位
        const mask = (BigInt(0xffffffffffffffffn) << BigInt(64 - prefix)) & BigInt(0xffffffffffffffffn);
        return (ipHigh & mask) === (netHigh & mask);
    } else {
        // 高 64 位必须完全匹配，低 64 位部分匹配
        if (ipHigh !== netHigh) {
            return false;
        }
        const mask = (BigInt(0xffffffffffffffffn) << BigInt(128 - prefix)) & BigInt(0xffffffffffffffffn);
        return (ipLow & mask) === (netLow & mask);
    }
}

/**
 * 检查 IP 地址是否在指定范围内
 * @param ip IP 地址
 * @param cidr CIDR 表示法
 */
export function isIpInRange(ip: string, cidr: string): boolean {
    if (isIPv4(ip)) {
        return isIpv4InRange(ip, cidr);
    } else if (isIPv6(ip)) {
        return isIpv6InRange(ip, cidr);
    }
    throw new Error(`Invalid IP address: ${ ip }`);
}

/**
 * 检查 IP 地址是否匹配任一范围
 * @param ip IP 地址
 * @param ranges CIDR 范围列表
 */
export function isIpInAnyRange(ip: string, ranges: string[]): boolean {
    for (const range of ranges) {
        try {
            if (isIpInRange(ip, range)) {
                return true;
            }
        } catch {
            // 忽略无效的 CIDR
            continue;
        }
    }
    return false;
}

