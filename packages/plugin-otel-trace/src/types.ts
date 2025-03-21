import type { InstrumentationConfig } from "@opentelemetry/instrumentation";
import type { Span } from '@opentelemetry/api';

/**
 * 跨度跟踪开始钩子
 */
export interface ISpanHook {
    (span: Span): void;
}

/**
 * 配置结构
 */
export interface INStarterInstrumentationConfig extends InstrumentationConfig {
    /**
     * 是否跟踪 callback 方法
     */
    traceCallback?: boolean;

    /**
     * 跨度跟踪钩子
     */
    onSpanStart?: ISpanHook;
}
