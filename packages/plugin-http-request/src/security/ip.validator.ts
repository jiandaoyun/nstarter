/**
 * IP 地址验证器
 */

import {
    isIPv4,
    isIPv6
} from 'node:net';
import type { IpValidationResult } from '../types';
import { isIpInAnyRange } from '../utils/ip.range';

/**
 * 私有 IP 地址范围（RFC 1918）
 */
const PRIVATE_IPV4_RANGES = [
    '10.0.0.0/8',       // 10.0.0.0 - 10.255.255.255
    '172.16.0.0/12',    // 172.16.0.0 - 172.31.255.255
    '192.168.0.0/16',   // 192.168.0.0 - 192.168.255.255
    '100.64.0.0/10'     // 100.64.0.0 - 100.127.255.255 (Shared Address Space, RFC 6598)
];

/**
 * 私有 IPv6 地址范围
 */
const PRIVATE_IPV6_RANGES = [
    'fc00::/7',         // Unique Local Address (ULA)
    'fd00::/8'          // Unique Local Address (ULA)
];

/**
 * 本地回环地址范围
 */
const LOOPBACK_IPV4_RANGES = [
    '127.0.0.0/8'       // 127.0.0.0 - 127.255.255.255
];

const LOOPBACK_IPV6_RANGES = [
    '::1/128'           // ::1
];

/**
 * Link-Local 地址范围
 */
const LINK_LOCAL_IPV4_RANGES = [
    '169.254.0.0/16'    // 169.254.0.0 - 169.254.255.255
];

const LINK_LOCAL_IPV6_RANGES = [
    'fe80::/10'         // fe80:: - febf::
];

/**
 * 组播地址范围
 */
const MULTICAST_IPV4_RANGES = [
    '224.0.0.0/4'       // 224.0.0.0 - 239.255.255.255
];

const MULTICAST_IPV6_RANGES = [
    'ff00::/8'          // ff00:: - ffff::
];

/**
 * 其他保留地址范围
 */
const RESERVED_IPV4_RANGES = [
    '0.0.0.0/8',        // Current network (RFC 1122)
    '192.0.0.0/24',     // IETF Protocol Assignments (RFC 6890)
    '192.0.2.0/24',     // TEST-NET-1 (RFC 5737)
    '198.18.0.0/15',    // Benchmarking (RFC 2544)
    '198.51.100.0/24',  // TEST-NET-2 (RFC 5737)
    '203.0.113.0/24',   // TEST-NET-3 (RFC 5737)
    '240.0.0.0/4',      // Reserved (RFC 1112)
    '255.255.255.255/32' // Broadcast
];

const RESERVED_IPV6_RANGES = [
    '::/128',           // Unspecified
    '::ffff:0:0/96',    // IPv4-mapped IPv6
    '64:ff9b::/96',     // IPv4/IPv6 translation (RFC 6052)
    '100::/64',         // Discard prefix (RFC 6666)
    '2001::/32',        // TEREDO (RFC 4380)
    '2001:10::/28',     // Deprecated (RFC 4843)
    '2001:db8::/32'     // Documentation (RFC 3849)
];

/**
 * IP 地址验证器类
 */
export class IpValidator {
    /**
     * 验证 IP 地址是否安全
     * @param ip IP 地址
     * @param allowPrivateIp 是否允许私有 IP
     * @returns 验证结果
     */
    public static validate(ip: string, allowPrivateIp = false): IpValidationResult {
        // 检查是否为有效的 IP 地址
        const isV4 = isIPv4(ip);
        const isV6 = isIPv6(ip);

        if (!isV4 && !isV6) {
            return {
                valid: false,
                ip,
                isPrivate: false,
                isLoopback: false,
                isLinkLocal: false,
                isMulticast: false,
                reason: 'Invalid IP address format'
            };
        }

        const ranges = isV4
            ? {
                private: PRIVATE_IPV4_RANGES,
                loopback: LOOPBACK_IPV4_RANGES,
                linkLocal: LINK_LOCAL_IPV4_RANGES,
                multicast: MULTICAST_IPV4_RANGES,
                reserved: RESERVED_IPV4_RANGES
            }
            : {
                private: PRIVATE_IPV6_RANGES,
                loopback: LOOPBACK_IPV6_RANGES,
                linkLocal: LINK_LOCAL_IPV6_RANGES,
                multicast: MULTICAST_IPV6_RANGES,
                reserved: RESERVED_IPV6_RANGES
            };

        const isPrivate = isIpInAnyRange(ip, ranges.private);
        const isLoopback = isIpInAnyRange(ip, ranges.loopback);
        const isLinkLocal = isIpInAnyRange(ip, ranges.linkLocal);
        const isMulticast = isIpInAnyRange(ip, ranges.multicast);
        const isReserved = isIpInAnyRange(ip, ranges.reserved);

        // 检查是否为受限 IP
        if (isLoopback) {
            return {
                valid: false,
                ip,
                isPrivate,
                isLoopback,
                isLinkLocal,
                isMulticast,
                reason: 'Loopback address is not allowed'
            };
        }

        if (isLinkLocal) {
            return {
                valid: false,
                ip,
                isPrivate,
                isLoopback,
                isLinkLocal,
                isMulticast,
                reason: 'Link-local address is not allowed'
            };
        }

        if (isMulticast) {
            return {
                valid: false,
                ip,
                isPrivate,
                isLoopback,
                isLinkLocal,
                isMulticast,
                reason: 'Multicast address is not allowed'
            };
        }

        if (isReserved) {
            return {
                valid: false,
                ip,
                isPrivate,
                isLoopback,
                isLinkLocal,
                isMulticast,
                reason: 'Reserved address is not allowed'
            };
        }

        if (isPrivate && !allowPrivateIp) {
            return {
                valid: false,
                ip,
                isPrivate,
                isLoopback,
                isLinkLocal,
                isMulticast,
                reason: 'Private IP address is not allowed'
            };
        }

        return {
            valid: true,
            ip,
            isPrivate,
            isLoopback,
            isLinkLocal,
            isMulticast
        };
    }

    /**
     * 批量验证 IP 地址
     * @param ips IP 地址列表
     * @param allowPrivateIp 是否允许私有 IP
     * @returns 验证结果列表
     */
    public static validateMany(
        ips: string[],
        allowPrivateIp = false
    ): IpValidationResult[] {
        return ips.map(ip => this.validate(ip, allowPrivateIp));
    }

    /**
     * 检查是否所有 IP 地址都有效
     * @param ips IP 地址列表
     * @param allowPrivateIp 是否允许私有 IP
     * @returns 是否所有 IP 都有效
     */
    public static validateAll(ips: string[], allowPrivateIp = false): boolean {
        return this.validateMany(ips, allowPrivateIp).every(result => result.valid);
    }
}

