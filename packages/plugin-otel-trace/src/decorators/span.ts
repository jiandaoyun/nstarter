import type { ISpanFunctionWrapOptions } from '../utils';
import { trace } from '@opentelemetry/api';
import { getAsyncSpanFunctionWrap, getSpanFunctionWrap } from '../utils';

import { pkg } from '../pkg';

/**
 * 跨度跟踪装饰器
 * @desc 用于跟踪类方法的执行过程
 * @param name 标记名称，默认为 `<ClassName>::<MethodName>`
 * @param options
 */
export function span(name?: string, options?: ISpanFunctionWrapOptions) {
    return (target: any, propertyKey: symbol | string, descriptor: PropertyDescriptor) => {
        const spanName = name || `${ target.constructor.name }::${ String(propertyKey) }`;
        const original = descriptor.value;
        const tracer = trace.getTracer(pkg.name);
        if (original[Symbol.toStringTag] === 'AsyncFunction') {
            // AsyncFunction
            descriptor.value = async (...args: any[]) => {
                return getAsyncSpanFunctionWrap(original, tracer, spanName)(target, ...args);
            };
        } else {
            descriptor.value = (...args: any[])=> {
                return getSpanFunctionWrap(original, tracer, spanName, options)(target, ...args);
            };
        }
    };
}
