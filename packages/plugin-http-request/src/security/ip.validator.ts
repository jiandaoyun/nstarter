/**
 * IP 地址验证器
 */

import {
    isIPv4,
    isIPv6
} from 'node:net';
import type { IpValidationResult } from '../types';
import { IpRangeUtils } from '../utils';
import {
    COMPILED_IPV4_RANGES,
    COMPILED_IPV6_RANGES
} from '../const';


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

        // 使用预编译的范围进行高性能检查
        let isPrivate: boolean;
        let isLoopback: boolean;
        let isLinkLocal: boolean;
        let isMulticast: boolean;
        let isReserved: boolean;

        if (isV4) {
            isPrivate = IpRangeUtils.isIpv4InAnyCompiledRange(ip, COMPILED_IPV4_RANGES.private);
            isLoopback = IpRangeUtils.isIpv4InAnyCompiledRange(ip, COMPILED_IPV4_RANGES.loopback);
            isLinkLocal = IpRangeUtils.isIpv4InAnyCompiledRange(ip, COMPILED_IPV4_RANGES.linkLocal);
            isMulticast = IpRangeUtils.isIpv4InAnyCompiledRange(ip, COMPILED_IPV4_RANGES.multicast);
            isReserved = IpRangeUtils.isIpv4InAnyCompiledRange(ip, COMPILED_IPV4_RANGES.reserved);
        } else {
            isPrivate = IpRangeUtils.isIpv6InAnyCompiledRange(ip, COMPILED_IPV6_RANGES.private);
            isLoopback = IpRangeUtils.isIpv6InAnyCompiledRange(ip, COMPILED_IPV6_RANGES.loopback);
            isLinkLocal = IpRangeUtils.isIpv6InAnyCompiledRange(ip, COMPILED_IPV6_RANGES.linkLocal);
            isMulticast = IpRangeUtils.isIpv6InAnyCompiledRange(ip, COMPILED_IPV6_RANGES.multicast);
            isReserved = IpRangeUtils.isIpv6InAnyCompiledRange(ip, COMPILED_IPV6_RANGES.reserved);
        }

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

