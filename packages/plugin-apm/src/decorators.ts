import { Logger } from 'nstarter-core';
import { apmConnector } from './connector';
import type { ISpanOptions, ITransactionOptions, Span, Transaction } from './types';
import { TraceResult, TraceType } from './enums';

/**
 * 完成 APM 跟踪记录
 * @param trace
 * @param result
 * @param type
 */
const _traceEnd = (trace: Transaction | Span, result: TraceResult, type: TraceType) => {
    if (type === TraceType.span) {
        return trace.end();
    }
    return (trace as Transaction).end(result);
};

/**
 * 跟踪 APM 函数执行
 *
 * 同时支持跟踪 Transaction 与 Span 场景
 *
 * IMPORTANT 函数调用结果返回必须保证与无装饰器时返回类型完全一致
 *
 * @param target
 * @param func
 * @param args
 * @param trace
 * @param type
 */
const _traceFunc = (target: any, func: any, args: any[], trace: Transaction | Span, type: TraceType): any => {
    // 处理回调
    const isCallbackMethod = args.length > 0 && typeof args[args.length - 1] === 'function';
    if (isCallbackMethod) {
        const callback = args[args.length - 1];
        args[args.length - 1] = (...cbArgs: any[]) => {
            if (cbArgs[0] && cbArgs[0] instanceof Error) {
                _traceEnd(trace, TraceResult.fail, type);
            } else {
                _traceEnd(trace, TraceResult.success, type);
            }
            return callback(...cbArgs);
        };
    }
    let result;
    try {
        result = func.apply(target, args);
    } catch (err) {
        _traceEnd(trace, TraceResult.fail, type);
        throw err;
    }
    if (result instanceof Promise) {
        // Promise 类型函数
        return Promise.resolve(result).then((result) => {
            _traceEnd(trace, TraceResult.success, type);
            return result;
        }, (err) => {
            _traceEnd(trace, TraceResult.fail, type);
            throw err;
        });
    } else {
        if (!isCallbackMethod) {
            _traceEnd(trace, TraceResult.success, type);
        }
        return result;
    }
};

/**
 * 跟踪事务
 * @param name
 * @param options
 */
export const apmTransaction = (name?: string, options: ITransactionOptions = {}): MethodDecorator => {
    const traceOptions = {
        type: null,
        labels: null,
        ...options
    };
    return (target, propertyKey: symbol | string, descriptor: PropertyDescriptor) => {
        const taskName = name || `${ target.constructor.name }:${ String(propertyKey) }`;
        const func = descriptor.value;
        descriptor.value = (...args: any[]) => {
            const apm = apmConnector.apm;
            if (!apm) {
                Logger.warn('Apm Agent is not defined!');
            }
            const trans = apm?.startTransaction(
                taskName, traceOptions.type
            );
            if (!trans) {
                // 无跟踪状态正常返回
                return func.apply(target, args);
            }
            // 跟踪
            if (traceOptions.labels) {
                trans.addLabels(traceOptions.labels);
            }
            return _traceFunc(target, func, args, trans, TraceType.trans);
        };
    };
};

/**
 * 跟踪事务内部分段
 * @param name
 * @param options
 */
export const apmSpan = (name?: string, options: ISpanOptions = {}): MethodDecorator => {
    const traceOptions = {
        type: null,
        subtype: null,
        action: null,
        labels: null,
        ...options
    };
    return (target, propertyKey: symbol | string, descriptor: PropertyDescriptor) => {
        const taskName = name || `${ target.constructor.name }:${ String(propertyKey) }`;
        const func = descriptor.value;
        descriptor.value = (...args: any[]) => {
            const apm = apmConnector.apm;
            if (!apm) {
                Logger.warn('Apm Agent is not defined!');
            }
            const span = apm?.startSpan(
                taskName, traceOptions.type, traceOptions.subtype, traceOptions.action
            );
            if (!span) {
                // 无跟踪状态正常返回
                return func.apply(target, args);
            }
            // 跟踪
            if (traceOptions.labels) {
                span.addLabels(traceOptions.labels);
            }
            return _traceFunc(target, func, args, span, TraceType.span);
        };
    };
};
