/**
 * HTTP 客户端核心类
 */

import type {
    HttpClientConfig,
    PartialHttpClientConfig,
    HttpRequestOptions,
    HttpResponse,
    IHttpAdapter,
    IHttpClient,
    ILogger,
    IHttpClientLogger,
    IForwardProxy,
    ISsrfGuard
} from './types';
import {
    mergeConfig,
    validateConfig
} from './config';
import { SsrfGuard } from './security';
import {
    AxiosAdapter,
    UndiciAdapter
} from './adapter';
import {
    NullLogger,
    NsHttpClientLogger
} from './logger';
import { EClientAdapter } from './const';
import { HttpError } from './types';
import { DomainUtils } from './utils';

/**
 * HTTP 客户端
 */
export class NsHttpClient implements IHttpClient {
    private config: HttpClientConfig;
    private adapter: IHttpAdapter;
    private ssrfGuard: ISsrfGuard;
    private logger: ILogger;
    private httpLogger?: IHttpClientLogger;
    private forwardProxy?: IForwardProxy;

    constructor(userConfig: PartialHttpClientConfig = {}) {
        // 合并配置
        this.config = mergeConfig(userConfig);

        // 验证配置
        validateConfig(this.config);

        // 初始化日志记录器
        this.logger = this.initLogger();
        this.httpLogger = this.initHttpLogger();

        // 初始化 SSRF 防护
        this.ssrfGuard = new SsrfGuard(this.config.security);

        // 初始化适配器
        this.adapter = this.initAdapter();

        this.logger.debug('NsHttpClient initialized', {
            adapter: this.config.adapter,
            security: {
                enableDnsValidation: this.config.security.enableDnsValidation,
                enableIpValidation: this.config.security.enableIpValidation,
                allowPrivateIp: this.config.security.allowPrivateIp
            }
        });
    }

    /**
     * 从配置创建 HTTP 客户端
     * @param config
     */
    public static fromHttpClientConfig(config: PartialHttpClientConfig = {}): NsHttpClient {
        return new NsHttpClient(config);
    }

    /**
     * 挂载适配器.
     * @param adapter
     */
    public withAdapter(adapter: EClientAdapter): this {
        this.config.adapter = adapter;
        this.adapter = this.initAdapter();
        return this;
    }

    /**
     * 挂载正向代理.
     * @param proxy
     */
    public withForwardProxy(proxy: IForwardProxy): this {
        this.forwardProxy = proxy;
        this.logger.info('Forward proxy configured', {
            enabled: proxy.enabled,
            http_proxy: proxy.http_proxy,
            https_proxy: proxy.https_proxy,
            no_proxy_count: proxy.no_proxy?.length || 0
        });
        return this;
    }

    /**
     * 初始化日志记录器
     */
    private initLogger(): ILogger {
        if (!this.config.logging.enabled) {
            return new NullLogger();
        }

        return this.config.logging.logger || new NullLogger();
    }

    /**
     * 初始化 HTTP 客户端日志记录器
     */
    private initHttpLogger(): IHttpClientLogger | undefined {
        if (!this.config.logging.enabled) {
            return undefined;
        }

        // 如果用户提供了自定义的 httpLogger，直接使用
        if (this.config.logging.httpLogger) {
            return this.config.logging.httpLogger;
        }

        // 否则，使用 NsHttpClientLogger 包装通用的 logger
        return NsHttpClientLogger.create(
            this.logger,
            this.config.logging.filter,
            {
                logRequestBody: this.config.logging.logRequestBody,
                logResponseBody: this.config.logging.logResponseBody,
                bodyMaxLength: this.config.logging.bodyMaxLength
            }
        );
    }

    /**
     * 初始化适配器
     */
    private initAdapter(): IHttpAdapter {
        const adapter = this.config.adapter === EClientAdapter.axios
            ? new AxiosAdapter(this.config.request, this.config.security, this.logger)
            : new UndiciAdapter(this.config.request, this.config.security, this.logger);

        if (!adapter.isAvailable()) {
            throw new Error(
                `Adapter "${ this.config.adapter }" is not available. ` +
                `Please install it: npm install ${ this.config.adapter }`
            );
        }

        return adapter;
    }

    /**
     * 发送 HTTP 请求
     * @param options 请求选项
     * @returns 响应结果
     */
    public async request<T = any>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
        const startTime = Date.now();

        try {
            // 安全验证
            const { safeUrl, result: ssrfResult } = await this.ssrfGuard.validateAndGetSafeUrl(options.url);

            this.logger.debug('URL validation passed', {
                originalUrl: options.url,
                safeUrl,
                resolvedIps: ssrfResult.resolvedIps,
                scenario: options.scenario
            });

            // 使用安全的 URL 发起请求
            const safeOptions: HttpRequestOptions = {
                ...options,
                url: safeUrl
            };

            // 如果 URL 被替换为 IP，需要设置 Host 头
            if (ssrfResult.safeIp && ssrfResult.hostname !== ssrfResult.safeIp) {
                safeOptions.headers = {
                    ...safeOptions.headers,
                    Host: ssrfResult.hostname
                };
            }

            // 应用正向代理配置
            if (this.forwardProxy) {
                this.applyForwardProxy(safeOptions);
            }

            // 发起请求
            const response = await this.adapter.request<T>(safeOptions);

            // 记录响应日志
            this.logResponse(safeOptions, response, Date.now() - startTime);

            return response;
        } catch (error) {
            // 记录错误日志
            this.logError(options, error, Date.now() - startTime);
            throw error;
        }
    }

    /**
     * 便捷方法：GET 请求
     */
    public async get<T = any>(
        url: string,
        options?: Partial<Omit<HttpRequestOptions, 'method' | 'url'>>
    ): Promise<HttpResponse<T>> {
        return this.request<T>({ ...options, method: 'GET', url });
    }

    /**
     * 便捷方法：POST 请求
     */
    public async post<T = any>(
        url: string,
        body?: any,
        options?: Partial<Omit<HttpRequestOptions, 'method' | 'url' | 'body'>>
    ): Promise<HttpResponse<T>> {
        return this.request<T>({ ...options, method: 'POST', url, body });
    }

    /**
     * 便捷方法：PUT 请求
     */
    public async put<T = any>(
        url: string,
        body?: any,
        options?: Partial<Omit<HttpRequestOptions, 'method' | 'url' | 'body'>>
    ): Promise<HttpResponse<T>> {
        return this.request<T>({ ...options, method: 'PUT', url, body });
    }

    /**
     * 便捷方法：DELETE 请求
     */
    public async delete<T = any>(
        url: string,
        options?: Partial<Omit<HttpRequestOptions, 'method' | 'url'>>
    ): Promise<HttpResponse<T>> {
        return this.request<T>({ ...options, method: 'DELETE', url });
    }

    /**
     * 便捷方法：PATCH 请求
     */
    public async patch<T = any>(
        url: string,
        body?: any,
        options?: Partial<Omit<HttpRequestOptions, 'method' | 'url' | 'body'>>
    ): Promise<HttpResponse<T>> {
        return this.request<T>({ ...options, method: 'PATCH', url, body });
    }

    /**
     * 记录响应日志
     */
    private logResponse(options: HttpRequestOptions, response: HttpResponse, duration: number): void {
        if (!this.httpLogger) {
            return;
        }

        // 计算实际重试次数
        const retryCount = options.retries ?? this.config.request.retries;

        this.httpLogger.logSuccess({
            request: {
                method: options.method,
                url: options.url,
                headers: options.headers,
                body: options.body,
                scenario: options.scenario,
                meta: options.meta
            },
            response,
            duration,
            retryCount
        });
    }

    /**
     * 记录错误日志
     */
    private logError(options: HttpRequestOptions, error: any, duration: number): void {
        if (!this.httpLogger) {
            return;
        }

        // 计算实际重试次数
        const retryCount = options.retries ?? this.config.request.retries;

        const httpError = error instanceof HttpError ? error : undefined;

        this.httpLogger.logFailed({
            request: {
                method: options.method,
                url: options.url,
                headers: options.headers,
                body: options.body,
                scenario: options.scenario,
                meta: options.meta
            },
            error: error instanceof Error ? error : new Error(String(error)),
            errorCode: httpError?.code || 'UNKNOWN_ERROR',
            status: httpError?.status,
            response: httpError?.response,
            duration,
            retryCount
        });
    }

    /**
     * 应用正向代理配置
     * @param options 请求选项
     */
    private applyForwardProxy(options: HttpRequestOptions): void {
        if (!this.forwardProxy || !this.forwardProxy.enabled) {
            return;
        }

        const { https_proxy, http_proxy, no_proxy } = this.forwardProxy;

        // 解析目标 URL
        const targetUrl = new URL(options.url);
        const hostname = targetUrl.hostname;

        // 检查 no_proxy 规则（使用传统匹配模式）
        const noProxyRegExps = DomainUtils.createLegacyDomainMatchers(no_proxy ?? []);
        if (noProxyRegExps.length > 0 && hostname) {
            for (const noProxyRegex of noProxyRegExps) {
                if (noProxyRegex.test(hostname)) {
                    this.logger.debug('Skip proxy for no_proxy matched host', {
                        hostname,
                        pattern: noProxyRegex.source
                    });
                    return;
                }
            }
        }

        const protocol = targetUrl.protocol || 'http:';
        const isHttps = /https:?/.test(protocol);
        const proxyUrl = isHttps ? https_proxy : http_proxy;

        if (!proxyUrl) {
            this.logger.warn('Forward proxy enabled but proxy URL not configured', {
                protocol
            });
            return;
        }

        // 将代理信息附加到请求元数据中，由适配器处理
        options.meta = {
            ...options.meta,
            __forwardProxy: {
                proxyUrl,
                isHttps,
                protocol
            }
        };

        this.logger.debug('Applied forward proxy', {
            url: options.url,
            proxyUrl,
            isHttps
        });
    }


    /**
     * 清空 DNS 缓存
     */
    public clearDnsCache(): void {
        this.ssrfGuard.clearDnsCache();
        this.logger.debug('DNS cache cleared');
    }

    /**
     * 获取 DNS 缓存大小
     * @returns 缓存条目数量
     */
    public getDnsCacheSize(): number {
        return this.ssrfGuard.getDnsCacheSize();
    }
}

