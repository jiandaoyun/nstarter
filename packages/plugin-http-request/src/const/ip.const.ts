import {
    compileIpv4Ranges,
    compileIpv6Ranges,
} from '../utils/ip.range';
import type {
    CompiledIpv4Range,
    CompiledIpv6Range
} from '../types';

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
 * IPV4 校验地址范围（原始 CIDR 字符串）
 */
export const IPV4_RANGES = {
    private: PRIVATE_IPV4_RANGES,
    loopback: LOOPBACK_IPV4_RANGES,
    linkLocal: LINK_LOCAL_IPV4_RANGES,
    multicast: MULTICAST_IPV4_RANGES,
    reserved: RESERVED_IPV4_RANGES
};

/**
 * IPV6 校验地址范围（原始 CIDR 字符串）
 */
export const IPV6_RANGES = {
    private: PRIVATE_IPV6_RANGES,
    loopback: LOOPBACK_IPV6_RANGES,
    linkLocal: LINK_LOCAL_IPV6_RANGES,
    multicast: MULTICAST_IPV6_RANGES,
    reserved: RESERVED_IPV6_RANGES
};

/**
 * 预编译的 IPV4 校验地址范围（高性能版本）
 */
export const COMPILED_IPV4_RANGES: {
    private: CompiledIpv4Range[],
    loopback: CompiledIpv4Range[],
    linkLocal: CompiledIpv4Range[],
    multicast: CompiledIpv4Range[],
    reserved: CompiledIpv4Range[]
} = {
    private: compileIpv4Ranges(PRIVATE_IPV4_RANGES),
    loopback: compileIpv4Ranges(LOOPBACK_IPV4_RANGES),
    linkLocal: compileIpv4Ranges(LINK_LOCAL_IPV4_RANGES),
    multicast: compileIpv4Ranges(MULTICAST_IPV4_RANGES),
    reserved: compileIpv4Ranges(RESERVED_IPV4_RANGES)
};

/**
 * 预编译的 IPV6 校验地址范围（高性能版本）
 */
export const COMPILED_IPV6_RANGES: {
    private: CompiledIpv6Range[],
    loopback: CompiledIpv6Range[],
    linkLocal: CompiledIpv6Range[],
    multicast: CompiledIpv6Range[],
    reserved: CompiledIpv6Range[]
} = {
    private: compileIpv6Ranges(PRIVATE_IPV6_RANGES),
    loopback: compileIpv6Ranges(LOOPBACK_IPV6_RANGES),
    linkLocal: compileIpv6Ranges(LINK_LOCAL_IPV6_RANGES),
    multicast: compileIpv6Ranges(MULTICAST_IPV6_RANGES),
    reserved: compileIpv6Ranges(RESERVED_IPV6_RANGES)
};
