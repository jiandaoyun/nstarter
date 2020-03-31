import { MetricsMonitor } from './lib';

/**
 * 性能统计
 * @param minTimeMS 触发记录的最短时间
 */
export function profiler(minTimeMS = 0) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        descriptor.value = async (...args: any[]) => {
            const start = Date.now();
            const result = await method.apply(target, args);
            const time = Date.now() - start;
            if (time > minTimeMS) {
                const labels = {
                    method: propertyKey,
                    class: target.constructor.name || ''
                };
                MetricsMonitor.recordFunction(labels, time);
            }
            return result;
        };
    };
}
