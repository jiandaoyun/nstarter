/**
 * W3C Trace Context 工具
 * 实现 W3C Trace Context 规范：https://www.w3.org/TR/trace-context/
 */

import type {
    TraceParent,
    TraceParentOptions
} from '../types';
import {
    TraceFlags
} from '../types';

/**
 * 生成随机十六进制字符串
 * @param length 字符串长度
 * @returns 十六进制字符串
 */
function generateRandomHex(length: number): string {
    const bytes = Math.ceil(length / 2);
    const buffer = new Uint8Array(bytes);

    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        crypto.getRandomValues(buffer);
    } else {
        // Fallback for Node.js environment
        for (let i = 0; i < bytes; i++) {
            buffer[i] = Math.floor(Math.random() * 256);
        }
    }

    return Array.from(buffer)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, length);
}

/**
 * 生成符合 W3C 规范的 Trace ID（32位十六进制）
 * @returns Trace ID
 */
export function generateTraceId(): string {
    return generateRandomHex(32);
}

/**
 * 生成符合 W3C 规范的 Span ID（16位十六进制）
 * @returns Span ID
 */
export function generateSpanId(): string {
    return generateRandomHex(16);
}

/**
 * 验证 Trace ID 格式
 * @param traceId Trace ID
 * @returns 是否有效
 */
export function isValidTraceId(traceId: string): boolean {
    // Trace ID 必须是32位十六进制字符串，且不能全为0
    return /^[0-9a-f]{32}$/i.test(traceId) && traceId !== '00000000000000000000000000000000';
}

/**
 * 验证 Span ID 格式
 * @param spanId Span ID
 * @returns 是否有效
 */
export function isValidSpanId(spanId: string): boolean {
    // Span ID 必须是16位十六进制字符串，且不能全为0
    return /^[0-9a-f]{16}$/i.test(spanId) && spanId !== '0000000000000000';
}

/**
 * 验证 Trace Flags 格式
 * @param flags Trace Flags
 * @returns 是否有效
 */
export function isValidTraceFlags(flags: string): boolean {
    // Trace Flags 必须是2位十六进制字符串
    return /^[0-9a-f]{2}$/i.test(flags);
}

/**
 * 生成 traceparent 头值
 * @param options 生成选项
 * @returns traceparent 字符串
 */
export function generateTraceParent(options: TraceParentOptions = {}): string {
    const traceId = options.traceId || generateTraceId();
    const parentId = options.parentId || generateSpanId();
    const sampled = options.sampled !== false;
    const traceFlags = sampled ? '01' : '00';

    // 验证参数
    if (!isValidTraceId(traceId)) {
        throw new Error(`Invalid trace ID: ${ traceId }. Must be 32 hex characters and not all zeros.`);
    }
    if (!isValidSpanId(parentId)) {
        throw new Error(`Invalid span ID: ${ parentId }. Must be 16 hex characters and not all zeros.`);
    }

    return `00-${ traceId }-${ parentId }-${ traceFlags }`;
}

/**
 * 解析 traceparent 头值
 * @param traceparent traceparent 字符串
 * @returns 解析后的对象，解析失败返回 null
 */
export function parseTraceParent(traceparent: string): TraceParent | null {
    if (!traceparent || typeof traceparent !== 'string') {
        return null;
    }

    // 规范格式：version-trace-id-parent-id-trace-flags
    const parts = traceparent.trim().split('-');

    if (parts.length !== 4) {
        return null;
    }

    const [version, traceId, parentId, traceFlags] = parts;

    // 验证版本号（当前只支持 00）
    if (version !== '00') {
        return null;
    }

    // 验证各部分格式
    if (!isValidTraceId(traceId) || !isValidSpanId(parentId) || !isValidTraceFlags(traceFlags)) {
        return null;
    }

    return {
        version,
        traceId: traceId.toLowerCase(),
        parentId: parentId.toLowerCase(),
        traceFlags: traceFlags.toLowerCase()
    };
}

/**
 * 验证 traceparent 头值是否符合规范
 * @param traceparent traceparent 字符串
 * @returns 是否有效
 */
export function isValidTraceParent(traceparent: string): boolean {
    return parseTraceParent(traceparent) !== null;
}

/**
 * 从现有 traceparent 创建子 span
 * @param parentTraceParent 父级 traceparent 字符串
 * @param sampled 是否采样（不提供则继承父级）
 * @returns 新的 traceparent 字符串
 */
export function createChildSpan(parentTraceParent: string, sampled?: boolean): string {
    const parsed = parseTraceParent(parentTraceParent);

    if (!parsed) {
        throw new Error(`Invalid parent traceparent: ${ parentTraceParent }`);
    }

    // 继承 trace ID，生成新的 span ID
    const newSpanId = generateSpanId();

    // 继承或指定采样标志
    const parentSampled = parseInt(parsed.traceFlags, 16) & TraceFlags.SAMPLED;
    const newSampled = sampled !== undefined ? sampled : !!parentSampled;
    const newFlags = newSampled ? '01' : '00';

    return `00-${ parsed.traceId }-${ newSpanId }-${ newFlags }`;
}

/**
 * 检查 traceparent 是否已采样
 * @param traceparent traceparent 字符串
 * @returns 是否采样
 */
export function isSampled(traceparent: string): boolean {
    const parsed = parseTraceParent(traceparent);
    if (!parsed) {
        return false;
    }

    const flags = parseInt(parsed.traceFlags, 16);
    return !!(flags & TraceFlags.SAMPLED);
}

/**
 * Trace Context 工具类
 */
export class TraceContext {
    /**
     * 生成 traceparent
     */
    public static generate = generateTraceParent;

    /**
     * 解析 traceparent
     */
    public static parse = parseTraceParent;

    /**
     * 验证 traceparent
     */
    public static isValid = isValidTraceParent;

    /**
     * 创建子 span
     */
    public static createChild = createChildSpan;

    /**
     * 检查是否采样
     */
    public static isSampled = isSampled;

    /**
     * 生成 Trace ID
     */
    public static generateTraceId = generateTraceId;

    /**
     * 生成 Span ID
     */
    public static generateSpanId = generateSpanId;

    /**
     * 验证 Trace ID
     */
    public static isValidTraceId = isValidTraceId;

    /**
     * 验证 Span ID
     */
    public static isValidSpanId = isValidSpanId;
}

