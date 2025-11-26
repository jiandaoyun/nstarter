/**
 * IP 地址验证器
 */

import {
    isIPv4,
    isIPv6
} from 'node:net';
import type { IpValidationResult } from '../types';
import {
    IPV4_RANGES,
    IPV6_RANGES
} from './ip.const';
import { IpRangeUtils } from '../utils';


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
                isReserved: false,
                reason: 'Invalid IP address format'
            };
        }

        const ranges = isV4 ? IPV4_RANGES : IPV6_RANGES;

        const isPrivate = IpRangeUtils.isIpInAnyRange(ip, ranges.private);
        const isLoopback = IpRangeUtils.isIpInAnyRange(ip, ranges.loopback);
        const isLinkLocal = IpRangeUtils.isIpInAnyRange(ip, ranges.linkLocal);
        const isMulticast = IpRangeUtils.isIpInAnyRange(ip, ranges.multicast);
        const isReserved = IpRangeUtils.isIpInAnyRange(ip, ranges.reserved);

        // 基础验证信息
        const baseResult = {
            ip,
            isPrivate,
            isLoopback,
            isLinkLocal,
            isMulticast,
            isReserved
        };

        // 检查是否为受限 IP - 按优先级顺序检查
        const restrictions = [
            { condition: isLoopback, reason: 'Loopback address is not allowed' },
            { condition: isLinkLocal, reason: 'Link-local address is not allowed' },
            { condition: isMulticast, reason: 'Multicast address is not allowed' },
            { condition: isReserved, reason: 'Reserved address is not allowed' },
            { condition: isPrivate && !allowPrivateIp, reason: 'Private IP address is not allowed' }
        ];

        for (const { condition, reason } of restrictions) {
            if (condition) {
                return {
                    valid: false,
                    ...baseResult,
                    reason
                };
            }
        }

        return {
            valid: true,
            ...baseResult
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

