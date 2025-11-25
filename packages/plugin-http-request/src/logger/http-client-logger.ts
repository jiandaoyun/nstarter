/**
 * HTTP 客户端日志记录器实现
 */

import type {
    IHttpClientLogger,
    ILogger,
    ILogFilter,
    IResFailedOptions,
    IResSuccessOptions,
    LogFilterConfig
} from '../types';
import { LogFilter } from './log-filter';

/**
 * HTTP 客户端日志记录器配置
 */
export interface HttpClientLoggerConfig {
    /** 底层日志记录器 */
    logger: ILogger;
    /** 日志过滤器（可选） */
    filter?: ILogFilter;
    /** 是否记录请求体 */
    logRequestBody?: boolean;
    /** 是否记录响应体 */
    logResponseBody?: boolean;
    /** 响应体最大记录长度（字节） */
    bodyMaxLength?: number;
}

/**
 * HTTP 客户端日志记录器
 * 将通用 ILogger 包装成专门的 IHttpClientLogger
 */
export class HttpClientLogger implements IHttpClientLogger {
    private logger: ILogger;
    private filter?: ILogFilter;
    private logRequestBody: boolean;
    private logResponseBody: boolean;
    private bodyMaxLength: number;

    constructor(config: HttpClientLoggerConfig) {
        this.logger = config.logger;
        this.filter = config.filter;
        this.logRequestBody = config.logRequestBody ?? false;
        this.logResponseBody = config.logResponseBody ?? false;
        this.bodyMaxLength = config.bodyMaxLength ?? 1024;
    }

    /**
     * 记录失败的请求
     */
    public logFailed(
        resOptions: Omit<IResFailedOptions, 'isSuccess' | 'timestamp'>
    ): void {
        const fullOptions: IResFailedOptions = {
            ...resOptions,
            isSuccess: false,
            timestamp: Date.now()
        };

        // 应用过滤器
        if (this.filter && !this.filter.shouldLog(fullOptions)) {
            return;
        }

        const meta = this.buildLogMeta(fullOptions);
        
        this.logger.error(
            `HTTP request failed: ${fullOptions.request.method} ${fullOptions.request.url}`,
            meta
        );
    }

    /**
     * 记录成功的请求
     */
    public logSuccess(
        resOptions: Omit<IResSuccessOptions, 'isSuccess' | 'timestamp'>
    ): void {
        const fullOptions: IResSuccessOptions = {
            ...resOptions,
            isSuccess: true,
            timestamp: Date.now()
        };

        // 应用过滤器
        if (this.filter && !this.filter.shouldLog(fullOptions)) {
            return;
        }

        const meta = this.buildLogMeta(fullOptions);
        
        this.logger.info(
            `HTTP request succeeded: ${fullOptions.request.method} ${fullOptions.request.url}`,
            meta
        );
    }

    /**
     * 构建日志元数据
     */
    private buildLogMeta(
        options: IResSuccessOptions | IResFailedOptions
    ): Record<string, any> {
        const meta: Record<string, any> = {
            method: options.request.method,
            url: options.request.url,
            duration: options.duration,
            timestamp: options.timestamp,
            retryCount: options.retryCount
        };

        // 添加场景信息
        if (options.request.scenario) {
            meta.scenario = options.request.scenario;
        }

        // 添加请求元数据
        if (options.request.meta) {
            meta.requestMeta = options.request.meta;
        }

        if (options.isSuccess) {
            // 成功的请求
            meta.status = options.response.status;
            meta.statusText = options.response.statusText;

            // 记录响应体（如果启用）
            if (this.logResponseBody && options.response.data) {
                meta.responseBody = this.truncateBody(options.response.data);
            }
        } else {
            // 失败的请求
            meta.error = options.error.message;
            meta.errorCode = options.errorCode;

            if (options.status !== undefined) {
                meta.status = options.status;
            }

            if (options.response && this.logResponseBody) {
                meta.responseBody = this.truncateBody(options.response.data);
            }
        }

        // 记录请求体（如果启用）
        if (this.logRequestBody && options.request.body) {
            meta.requestBody = this.truncateBody(options.request.body);
        }

        return meta;
    }

    /**
     * 截断请求/响应体到指定长度
     */
    private truncateBody(body: any): any {
        if (!body) {
            return body;
        }

        try {
            const bodyStr = typeof body === 'string' 
                ? body 
                : JSON.stringify(body);

            if (bodyStr.length <= this.bodyMaxLength) {
                return body;
            }

            return bodyStr.substring(0, this.bodyMaxLength) + '... (truncated)';
        } catch {
            return '[unable to serialize body]';
        }
    }

    /**
     * 创建 HTTP 客户端日志记录器
     * @param logger 底层日志记录器
     * @param filterConfig 过滤器配置
     * @param options 其他选项
     */
    public static create(
        logger: ILogger,
        filterConfig?: LogFilterConfig,
        options?: {
            logRequestBody?: boolean;
            logResponseBody?: boolean;
            bodyMaxLength?: number;
        }
    ): HttpClientLogger {
        return new HttpClientLogger({
            logger,
            filter: filterConfig ? new LogFilter(filterConfig) : undefined,
            logRequestBody: options?.logRequestBody,
            logResponseBody: options?.logResponseBody,
            bodyMaxLength: options?.bodyMaxLength
        });
    }
}

