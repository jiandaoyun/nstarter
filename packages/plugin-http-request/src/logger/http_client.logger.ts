/**
 * HTTP 客户端日志记录器实现
 */

import type {
    IHttpClientLogger,
    ILogger,
    ILogFilter,
    IResFailedOptions,
    IResSuccessOptions,
    LogFilterConfig,
    HttpClientLoggerConfig
} from '../types';
import { LogFilter } from './log.filter';

/**
 * HTTP 客户端日志记录器
 * 将通用 ILogger 包装成专门的 IHttpClientLogger
 */
export class NsHttpClientLogger implements IHttpClientLogger {
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
            `HTTP request failed: ${ fullOptions.request.method } ${ fullOptions.request.url }`,
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
            `HTTP request succeeded: ${ fullOptions.request.method } ${ fullOptions.request.url }`,
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

            // 记录流式响应指标
            if (options.streamMetrics) {
                meta.streamMetrics = {
                    ttfb: options.streamMetrics.ttfb,
                    completed: options.streamMetrics.completed
                };

                if (options.streamMetrics.completed) {
                    meta.streamMetrics.totalDuration = options.streamMetrics.totalDuration;
                    meta.streamMetrics.streamDuration =
                        (options.streamMetrics.totalDuration ?? 0) - options.streamMetrics.ttfb;

                    if (options.streamMetrics.bytesTransferred !== undefined) {
                        meta.streamMetrics.bytesTransferred = options.streamMetrics.bytesTransferred;
                        meta.streamMetrics.bytesTransferredHuman =
                            this.formatBytes(options.streamMetrics.bytesTransferred);

                        // 计算吞吐量
                        const streamDuration = meta.streamMetrics.streamDuration;
                        if (streamDuration > 0) {
                            const throughputBps =
                                options.streamMetrics.bytesTransferred / (streamDuration / 1000);
                            meta.streamMetrics.throughput = `${ (throughputBps / 1024).toFixed(2) } KB/s`;
                        }
                    }
                }
            }

            // 记录响应体（如果启用，且不是流式响应）
            if (this.logResponseBody && !options.streamMetrics) {
                meta.responseBody = this.truncateBody(options.response.data);
            } else if (options.streamMetrics && !options.streamMetrics.completed) {
                // 流式响应但未完成，标记为流
                meta.responseBody = '# --- stream (in progress) --- #';
            } else if (options.streamMetrics && options.streamMetrics.completed) {
                // 流式响应已完成
                meta.responseBody = '# --- stream (completed) --- #';
            }
        } else {
            // 失败的请求
            meta.error = options.error.message;
            meta.errorCode = options.errorCode;

            if (options.status !== undefined) {
                meta.status = options.status;
            }

            if (options.response) {
                meta.responseBody = this.truncateBody(options.response.data);
            }
        }

        // 记录请求体（如果启用）
        if (this.logRequestBody) {
            meta.requestBody = this.truncateBody(options.request.body);
        }

        return meta;
    }

    /**
     * 格式化字节数为人类可读格式
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) {
            return '0 Bytes';
        }

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${ parseFloat((bytes / Math.pow(k, i)).toFixed(2)) } ${ sizes[i] }`;
    }

    /**
     * 截断请求/响应体到指定长度
     * 对于特殊类型（Stream、Buffer等）返回标记文本
     */
    private truncateBody(body: any): any {
        // 处理 null 和 undefined
        if (body === null) {
            return '# --- null --- #';
        }
        if (body === undefined) {
            return '# --- undefined --- #';
        }

        // 处理基本类型
        if (typeof body === 'number' || typeof body === 'boolean') {
            return body;
        }

        // 处理字符串
        if (typeof body === 'string') {
            if (body.length <= this.bodyMaxLength) {
                return body;
            }
            return body.substring(0, this.bodyMaxLength) + '... (truncated)';
        }

        // 处理 Buffer
        if (Buffer.isBuffer(body)) {
            return `# --- buffer (${ body.length } bytes) --- #`;
        }

        // 处理 Stream
        if (typeof body === 'object' && typeof body.pipe === 'function') {
            return '# --- stream --- #';
        }

        // 处理 ArrayBuffer
        if (body instanceof ArrayBuffer ||
            (typeof body === 'object' && body.constructor?.name === 'ArrayBuffer')) {
            return `# --- arraybuffer (${ body.byteLength } bytes) --- #`;
        }

        // 处理 Blob (浏览器环境)
        if (typeof body === 'object' && body.constructor?.name === 'Blob') {
            return `# --- blob (${ body.size } bytes) --- #`;
        }

        // 处理普通对象和数组
        try {
            const bodyStr = JSON.stringify(body);
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
            logRequestBody?: boolean,
            logResponseBody?: boolean,
            bodyMaxLength?: number
        }
    ): NsHttpClientLogger {
        return new NsHttpClientLogger({
            logger,
            filter: filterConfig ? new LogFilter(filterConfig) : undefined,
            logRequestBody: options?.logRequestBody,
            logResponseBody: options?.logResponseBody,
            bodyMaxLength: options?.bodyMaxLength
        });
    }
}

