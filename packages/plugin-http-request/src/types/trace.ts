/**
 * Trace 标志位
 */
export enum TraceFlags {
    /** 未采样 */
    NONE = 0x00,
    /** 已采样 */
    SAMPLED = 0x01
}

/**
 * Traceparent 接口
 */
export interface TraceParent {
    /** 版本号（当前固定为 00） */
    version: string;
    /** Trace ID（32位十六进制字符串） */
    traceId: string;
    /** Parent ID/Span ID（16位十六进制字符串） */
    parentId: string;
    /** Trace 标志位（2位十六进制字符串） */
    traceFlags: string;
}

/**
 * Traceparent 生成选项
 */
export interface TraceParentOptions {
    /** 自定义 Trace ID（不提供则自动生成） */
    traceId?: string;
    /** 自定义 Parent ID（不提供则自动生成） */
    parentId?: string;
    /** 是否采样（默认 true） */
    sampled?: boolean;
}
