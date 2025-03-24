import { SpanStatusCode } from '@opentelemetry/api';
import type { Span, Tracer } from '@opentelemetry/api';
import type { Span as SpanClass } from '@opentelemetry/sdk-trace-node';
import type { ISpanHook } from './types';

/**
 * 跨度跟踪开始
 * @param tracer
 * @param name
 */
export const startSpan = (tracer: Tracer, name: string): Span => {
    return tracer.startSpan(name, {
        attributes: {
            // 上下文元数据

        }
    });
};

/**
 * 跨度跟踪结束
 * @param span
 * @param err
 */
export const endSpan = (
    span: Span,
    err?: NodeJS.ErrnoException | null
) => {
    if (err) {
        span.recordException(err);
        span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err.message,
        });
    }
    span.end();
};

export interface ISpanFunctionWrapOptions {
    traceCallback?: boolean;
    onSpanStart?: ISpanHook;
}

/**
 * 函数跨度跟踪方法生成器 (同步)
 * @param original 原始函数
 * @param tracer 跟踪器
 * @param scope 标识
 * @param options 配置参数
 */
export const getSpanFunctionWrap = (
    original: any,
    tracer: Tracer,
    scope: string,
    options?: ISpanFunctionWrapOptions
) => {
    const opts = {
        traceCallback: false,
        ...options
    };
    return function(this: any, ...args: any[]) {
        const span = startSpan(tracer, scope);
        if (options?.onSpanStart) {
            options.onSpanStart.call(this, span as SpanClass);
        }
        if (opts.traceCallback
            && args.length > 0
            && typeof args[args.length - 1] === 'function'
        ) {
            // Callback Function
            const callback = args[args.length - 1];
            args[args.length - 1] = (...cbArgs: any[])=> {
                if (cbArgs[0] && cbArgs[0] instanceof Error) {
                    endSpan(span, cbArgs[0]);
                } else {
                    endSpan(span);
                }
                return callback.apply(this, cbArgs);
            };
        }
        let result;
        try {
            result = original.apply(this, args);
        } catch (error: any) {
            endSpan(span, error);
            throw error;
        }
        // @note sdk 允许重复调用 `span.end`
        endSpan(span);
        return result;
    };
};

/**
 * 函数跨度跟踪方法生成器 (异步)
 * @param original 原始函数
 * @param tracer 跟踪器
 * @param scope 标识
 * @param options 配置参数
 */
export const getAsyncSpanFunctionWrap = (
    original: any,
    tracer: Tracer,
    scope: string,
    options?: ISpanFunctionWrapOptions
) => {
    return async function(this: any, ...args: any[]) {
        const span = startSpan(tracer, scope);
        if (options?.onSpanStart) {
            options.onSpanStart.call(this, span as SpanClass);
        }
        try {
            const result = await original.apply(this, args);
            endSpan(span);
            return result;
        } catch (error: any) {
            endSpan(span, error);
            throw error;
        }
    };
};
