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
        return (
            this.checkSuccessOrFailedFilter(options) &&
            this.checkMethodFilter(options) &&
            this.checkUrlPatternFilter(options) &&
            this.checkScenarioFilter(options) &&
            this.checkStatusCodeFilter(options) &&
            this.checkDurationFilter(options) &&
            this.checkCustomFilter(options)
        );
    }

    /**
     * 检查成功/失败过滤
     */
    private checkSuccessOrFailedFilter(options: IResSuccessOptions | IResFailedOptions): boolean {
        if (this.config.onlyFailed && options.isSuccess) {
            return false;
        }
        if (this.config.onlySuccess && !options.isSuccess) {
            return false;
        }
        return true;
    }

    /**
     * 检查 HTTP 方法过滤
     */
    private checkMethodFilter(options: IResSuccessOptions | IResFailedOptions): boolean {
        if (this.config.methods && this.config.methods.length > 0) {
            return this.config.methods.includes(options.request.method);
        }
        return true;
    }

    /**
     * 检查 URL 模式过滤
     */
    private checkUrlPatternFilter(options: IResSuccessOptions | IResFailedOptions): boolean {
        if (this.config.urlPatterns && this.config.urlPatterns.length > 0) {
            return this.config.urlPatterns.some(pattern => {
                if (typeof pattern === 'string') {
                    return options.request.url.includes(pattern);
                }
                return pattern.test(options.request.url);
            });
        }
        return true;
    }

    /**
     * 检查场景过滤
     */
    private checkScenarioFilter(options: IResSuccessOptions | IResFailedOptions): boolean {
        if (this.config.scenarios && this.config.scenarios.length > 0) {
            return !!options.request.scenario && this.config.scenarios.includes(options.request.scenario);
        }
        return true;
    }

    /**
     * 检查状态码过滤
     */
    private checkStatusCodeFilter(options: IResSuccessOptions | IResFailedOptions): boolean {
        const status = options.isSuccess ? options.response.status : options.status;
        if (status === undefined) {
            return true;
        }

        // 检查特定状态码
        if (this.config.statusCodes && this.config.statusCodes.length > 0) {
            if (!this.config.statusCodes.includes(status)) {
                return false;
            }
        }

        // 检查状态码范围
        if (this.config.statusCodeRanges && this.config.statusCodeRanges.length > 0) {
            return this.config.statusCodeRanges.some(
                range => status >= range.min && status <= range.max
            );
        }

        return true;
    }

    /**
     * 检查请求耗时过滤
     */
    private checkDurationFilter(options: IResSuccessOptions | IResFailedOptions): boolean {
        if (this.config.minDuration !== undefined && options.duration !== undefined) {
            return options.duration >= this.config.minDuration;
        }
        return true;
    }

    /**
     * 检查自定义过滤函数
     */
    private checkCustomFilter(options: IResSuccessOptions | IResFailedOptions): boolean {
        if (this.config.customFilter) {
            return this.config.customFilter(options);
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

