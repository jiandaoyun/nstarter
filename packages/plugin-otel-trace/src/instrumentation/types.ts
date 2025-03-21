import { InstrumentationConfig } from "@opentelemetry/instrumentation";


/**
 * 配置结构
 */
export interface INStarterInstrumentationConfig extends InstrumentationConfig {
    /**
     * 是否跟踪 callback 方法
     */
    traceCallback?: boolean;
}
