/**
 * HTTP 适配器基础实现
 */

import type {
    IHttpAdapter,
    HttpRequestOptions,
    HttpResponse,
    RequestConfig,
    ILogger,
    AdapterType
} from '../types';

/**
 * 重试选项
 */
export interface RetryOptions {
    /** 重试次数 */
    retries: number;
    /** 重试延迟（毫秒） */
    retryDelay: number;
    /** 是否应该重试（根据错误判断） */
    shouldRetry?: (error: any, attempt: number) => boolean;
}

/**
 * 默认的重试判断函数
 * @param error 错误对象
 * @returns 是否应该重试
 */
export function defaultShouldRetry(error: any): boolean {
    // 网络错误应该重试
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        return true;
    }

    // 5xx 服务器错误应该重试
    if (error.response?.status >= 500) {
        return true;
    }

    // 429 Too Many Requests 应该重试
    if (error.response?.status === 429) {
        return true;
    }

    return false;
}

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

/**
 * HTTP 适配器抽象基类
 */
export abstract class BaseHttpAdapter implements IHttpAdapter {
    protected requestConfig: RequestConfig;
    protected logger?: ILogger;

    constructor(requestConfig: RequestConfig, logger?: ILogger) {
        this.requestConfig = requestConfig;
        this.logger = logger;
    }

    public abstract readonly name: AdapterType;

    /**
     * 发送 HTTP 请求（由子类实现）
     * @param options 请求选项
     */
    protected abstract sendRequest<T>(options: HttpRequestOptions): Promise<HttpResponse<T>>;

    /**
     * 检查适配器是否可用
     */
    public abstract isAvailable(): boolean;

    /**
     * 发送请求（带重试机制）
     * @param options 请求选项
     */
    public async request<T = any>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
        const retries = options.retries ?? this.requestConfig.retries;
        const retryDelay = this.requestConfig.retryDelay;
        const timeout = options.timeout ?? this.requestConfig.timeout;

        // 合并选项
        const finalOptions: HttpRequestOptions = {
            ...options,
            timeout
        };

        let lastError: any;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                this.logger?.debug(`HTTP request attempt ${ attempt + 1 }/${ retries + 1 }`, {
                    method: options.method,
                    url: options.url,
                    scenario: options.scenario
                });

                const response = await this.sendRequest<T>(finalOptions);

                if (attempt > 0) {
                    this.logger?.info(`HTTP request succeeded after ${ attempt } retries`, {
                        method: options.method,
                        url: options.url,
                        status: response.status
                    });
                }

                return response;
            } catch (error) {
                lastError = error;

                this.logger?.warn(`HTTP request attempt ${ attempt + 1 } failed`, {
                    method: options.method,
                    url: options.url,
                    error: error instanceof Error ? error.message : String(error)
                });

                // 最后一次尝试，不再重试
                if (attempt === retries) {
                    break;
                }

                // 判断是否应该重试
                if (!defaultShouldRetry(error)) {
                    this.logger?.debug('Error is not retryable, stopping retry attempts', {
                        error: error instanceof Error ? error.message : String(error)
                    });
                    break;
                }

                // 等待后重试
                await delay(retryDelay * (attempt + 1));
            }
        }

        // 所有尝试都失败了
        this.logger?.error('All HTTP request attempts failed', {
            method: options.method,
            url: options.url,
            attempts: retries + 1,
            error: lastError instanceof Error ? lastError.message : String(lastError)
        });

        throw lastError;
    }

    /**
     * 更新请求配置
     * @param config 新的请求配置
     */
    public updateConfig(config: Partial<RequestConfig>): void {
        this.requestConfig = { ...this.requestConfig, ...config };
    }

    /**
     * 设置日志记录器
     * @param logger 日志记录器
     */
    public setLogger(logger: ILogger): void {
        this.logger = logger;
    }

    /**
     * 构建查询字符串
     * @param params 查询参数
     */
    protected buildQueryString(params?: Record<string, string | number | boolean>): string {
        if (!params || Object.keys(params).length === 0) {
            return '';
        }

        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            searchParams.append(key, String(value));
        }

        return searchParams.toString();
    }

    /**
     * 构建完整 URL
     * @param url 基础 URL
     * @param params 查询参数
     */
    protected buildUrl(url: string, params?: Record<string, string | number | boolean>): string {
        const queryString = this.buildQueryString(params);
        if (!queryString) {
            return url;
        }

        const separator = url.includes('?') ? '&' : '?';
        return `${ url }${ separator }${ queryString }`;
    }

    /**
     * 标准化响应头
     * @param headers 原始响应头
     */
    protected normalizeHeaders(headers: any): Record<string, string> {
        const normalized: Record<string, string> = {};

        if (!headers) {
            return normalized;
        }

        // 处理不同的头格式
        if (typeof headers === 'object') {
            for (const [key, value] of Object.entries(headers)) {
                if (value !== undefined && value !== null) {
                    normalized[key.toLowerCase()] = String(value);
                }
            }
        }

        return normalized;
    }
}

