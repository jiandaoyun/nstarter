/**
 * 日志过滤器实现
 */

import type {
    ILogFilter,
    LogFilterConfig,
    IResSuccessOptions,
    IResFailedOptions
} from '../types';

/**
 * 默认日志过滤器
 */
export class LogFilter implements ILogFilter {
    private config: LogFilterConfig;

    constructor(config: LogFilterConfig = {}) {
        this.config = config;
    }

    /**
     * 判断是否应该记录此日志
     * @param options 日志选项（成功或失败）
     * @returns 是否应该记录
     */
    public shouldLog(options: IResSuccessOptions | IResFailedOptions): boolean {
        const { config } = this;

        // 1. 检查成功/失败过滤
        if (config.onlyFailed && options.isSuccess) {
            return false;
        }
        if (config.onlySuccess && !options.isSuccess) {
            return false;
        }

        // 2. 检查 HTTP 方法
        if (config.methods && config.methods.length > 0) {
            if (!config.methods.includes(options.request.method)) {
                return false;
            }
        }

        // 3. 检查 URL 模式
        if (config.urlPatterns && config.urlPatterns.length > 0) {
            const matched = config.urlPatterns.some(pattern => {
                if (typeof pattern === 'string') {
                    return options.request.url.includes(pattern);
                }
                return pattern.test(options.request.url);
            });
            if (!matched) {
                return false;
            }
        }

        // 4. 检查场景
        if (config.scenarios && config.scenarios.length > 0) {
            if (!options.request.scenario || !config.scenarios.includes(options.request.scenario)) {
                return false;
            }
        }

        // 5. 检查状态码（仅对成功的请求或有响应的失败请求）
        const status = options.isSuccess ? options.response.status : options.status;
        if (status !== undefined) {
            // 检查特定状态码
            if (config.statusCodes && config.statusCodes.length > 0) {
                if (!config.statusCodes.includes(status)) {
                    return false;
                }
            }

            // 检查状态码范围
            if (config.statusCodeRanges && config.statusCodeRanges.length > 0) {
                const inRange = config.statusCodeRanges.some(
                    range => status >= range.min && status <= range.max
                );
                if (!inRange) {
                    return false;
                }
            }
        }

        // 6. 检查请求耗时
        if (config.minDuration !== undefined && options.duration !== undefined) {
            if (options.duration < config.minDuration) {
                return false;
            }
        }

        // 7. 自定义过滤函数
        if (config.customFilter) {
            if (!config.customFilter(options)) {
                return false;
            }
        }

        return true;
    }

    /**
     * 更新过滤器配置
     * @param config 新的配置
     */
    public updateConfig(config: LogFilterConfig): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * 获取当前配置
     * @returns 当前配置
     */
    public getConfig(): LogFilterConfig {
        return { ...this.config };
    }
}

