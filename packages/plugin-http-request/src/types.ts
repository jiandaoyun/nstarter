/**
 * HTTP 客户端类型定义
 */

import type { EHttpRequestClientAdapter } from './enum';

/**
 * HTTP 方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * 代理配置
 */
export interface ProxyConfig {
    host: string;
    port: number;
    protocol: 'http' | 'https';
    auth?: {
        username: string,
        password: string
    };
}

/**
 * 安全配置
 */
export interface SecurityConfig {
    /** 启用 DNS 验证 */
    enableDnsValidation: boolean;
    /** 启用 IP 地址验证 */
    enableIpValidation: boolean;
    /** 允许访问私有 IP */
    allowPrivateIp: boolean;
    /** 域名白名单（支持通配符，如 *.example.com） */
    whitelist: string[];
    /** 域名黑名单（支持通配符） */
    blacklist: string[];
    /** DNS 缓存 TTL（毫秒） */
    dnsCacheTtl: number;
}

/**
 * 日志记录器接口
 */
export interface ILogger {
    debug: (message: string, meta?: Record<string, any>) => void;
    info: (message: string, meta?: Record<string, any>) => void;
    warn: (message: string, meta?: Record<string, any>) => void;
    error: (message: string, meta?: Record<string, any>) => void;
}

/**
 * 日志配置
 */
export interface LoggingConfig {
    /** 启用日志 */
    enabled: boolean;
    /** 自定义日志记录器 */
    logger?: ILogger;
    /** 记录请求体 */
    logRequestBody: boolean;
    /** 记录响应体 */
    logResponseBody: boolean;
    /** 响应体最大记录长度（字节） */
    bodyMaxLength: number;
}

/**
 * 请求配置
 */
export interface RequestConfig {
    /** 超时时间（毫秒） */
    timeout: number;
    /** 重试次数 */
    retries: number;
    /** 重试延迟（毫秒） */
    retryDelay: number;
    /** 代理配置 */
    proxy?: ProxyConfig;
    /** 最大重定向次数 */
    maxRedirects: number;
    /** 最大响应体大小（字节） */
    maxBodySize: number;
}

/**
 * HTTP 客户端配置
 */
export interface HttpClientConfig {
    /** 适配器类型 */
    adapter: EHttpRequestClientAdapter;
    /** 安全配置 */
    security: SecurityConfig;
    /** 日志配置 */
    logging: LoggingConfig;
    /** 请求配置 */
    request: RequestConfig;
}

/**
 * 部分 HTTP 客户端配置（用于创建实例时）
 */
export interface PartialHttpClientConfig {
    adapter?: EHttpRequestClientAdapter;
    security?: Partial<SecurityConfig>;
    logging?: Partial<LoggingConfig>;
    request?: Partial<RequestConfig>;
}

/**
 * HTTP 请求选项
 */
export interface HttpRequestOptions {
    /** HTTP 方法 */
    method: HttpMethod;
    /** 请求 URL */
    url: string;
    /** 请求头 */
    headers?: Record<string, string | number>;
    /** URL 查询参数 */
    params?: Record<string, string | number | boolean>;
    /** 请求体 */
    body?: any;
    /** 请求超时（毫秒，覆盖全局配置） */
    timeout?: number;
    /** 重试次数（覆盖全局配置） */
    retries?: number;
    /** 业务场景标识 */
    scenario?: string;
    /** 业务元数据 */
    meta?: Record<string, any>;
    /** 响应类型 */
    responseType?: 'json' | 'text' | 'stream' | 'arraybuffer';
}

/**
 * HTTP 响应
 */
export interface HttpResponse<T = any> {
    /** 响应状态码 */
    status: number;
    /** 响应状态文本 */
    statusText: string;
    /** 响应头 */
    headers: Record<string, string>;
    /** 响应体 */
    data: T;
    /** 请求配置 */
    config: HttpRequestOptions;
}

/**
 * HTTP 错误
 */
export class HttpError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly status?: number,
        public readonly response?: HttpResponse,
        public readonly request?: HttpRequestOptions
    ) {
        super(message);
        this.name = 'HttpError';
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 安全验证错误
 */
export class SecurityError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly url?: string
    ) {
        super(message);
        this.name = 'SecurityError';
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * DNS 解析结果
 */
export interface DnsResult {
    /** 域名 */
    hostname: string;
    /** 解析到的 IP 地址列表 */
    addresses: string[];
    /** 解析时间戳 */
    timestamp: number;
    /** TTL */
    ttl: number;
}

/**
 * IP 验证结果
 */
export interface IpValidationResult {
    /** 是否有效 */
    valid: boolean;
    /** IP 地址 */
    ip: string;
    /** 是否为私有 IP */
    isPrivate: boolean;
    /** 是否为回环地址 */
    isLoopback: boolean;
    /** 是否为 Link-Local */
    isLinkLocal: boolean;
    /** 是否为组播地址 */
    isMulticast: boolean;
    /** 原因（当 valid 为 false 时） */
    reason?: string;
}

/**
 * URL 验证结果
 */
export interface UrlValidationResult {
    /** 是否有效 */
    valid: boolean;
    /** URL */
    url: string;
    /** 是否在白名单中 */
    inWhitelist: boolean;
    /** 是否在黑名单中 */
    inBlacklist: boolean;
    /** 原因（当 valid 为 false 时） */
    reason?: string;
}

/**
 * HTTP 适配器接口
 */
export interface IHttpAdapter {
    /** 适配器名称 */
    readonly name: EHttpRequestClientAdapter;

    /**
     * 发送 HTTP 请求
     * @param options 请求选项
     * @returns 响应结果
     */
    request: <T = any>(options: HttpRequestOptions) => Promise<HttpResponse<T>>;

    /**
     * 检查适配器是否可用
     * @returns 是否可用
     */
    isAvailable: () => boolean;

    /**
     * 更新适配器配置
     * @param config 请求配置
     */
    updateConfig: (config: Partial<RequestConfig>) => void;
}


/**
 * 正向代理配置
 */
interface IForwardProxy {
    enabled: boolean;
    https_proxy: string;
    http_proxy: string;
    no_proxy: string[];
}

/**
 * HTTP 客户端接口
 */
export interface IHttpClient {
    /**
     * 挂载适配器.
     * @param adapter
     * @returns this
     */
    withAdapter: (adapter: EHttpRequestClientAdapter) => this;

    /**
     * 挂载正向代理.
     * @param proxy
     * @returns this
     */
    withForwardProxy: (proxy: IForwardProxy) => this;

    /**
     * 发送 HTTP 请求
     * @param options 请求选项
     * @returns 响应结果
     */
    request: <T = any>(options: HttpRequestOptions) => Promise<HttpResponse<T>>;

    /**
     * GET 请求
     * @param url 请求 URL
     * @param options 其他请求选项
     * @returns 响应结果
     */
    get: <T = any>(
        url: string,
        options?: Partial<Omit<HttpRequestOptions, 'method' | 'url'>>
    ) => Promise<HttpResponse<T>>;

    /**
     * POST 请求
     * @param url 请求 URL
     * @param body 请求体
     * @param options 其他请求选项
     * @returns 响应结果
     */
    post: <T = any>(
        url: string,
        body?: any,
        options?: Partial<Omit<HttpRequestOptions, 'method' | 'url' | 'body'>>
    ) => Promise<HttpResponse<T>>;

    /**
     * PUT 请求
     * @param url 请求 URL
     * @param body 请求体
     * @param options 其他请求选项
     * @returns 响应结果
     */
    put: <T = any>(
        url: string,
        body?: any,
        options?: Partial<Omit<HttpRequestOptions, 'method' | 'url' | 'body'>>
    ) => Promise<HttpResponse<T>>;

    /**
     * DELETE 请求
     * @param url 请求 URL
     * @param options 其他请求选项
     * @returns 响应结果
     */
    delete: <T = any>(
        url: string,
        options?: Partial<Omit<HttpRequestOptions, 'method' | 'url'>>
    ) => Promise<HttpResponse<T>>;

    /**
     * PATCH 请求
     * @param url 请求 URL
     * @param body 请求体
     * @param options 其他请求选项
     * @returns 响应结果
     */
    patch: <T = any>(
        url: string,
        body?: any,
        options?: Partial<Omit<HttpRequestOptions, 'method' | 'url' | 'body'>>
    ) => Promise<HttpResponse<T>>;

    /**
     * 更新配置
     * @param config 新的配置（部分）
     */
    updateConfig: (config: PartialHttpClientConfig) => void;

    /**
     * 获取当前配置
     * @returns 配置副本
     */
    getConfig: () => HttpClientConfig;

    /**
     * 清空 DNS 缓存
     */
    clearDnsCache: () => void;

    /**
     * 获取 DNS 缓存大小
     * @returns 缓存条目数量
     */
    getDnsCacheSize: () => number;
}

/**
 * 日志记录器.
 */
export interface IHttpClientLogger {
    logFailed: (
        resOptions: Omit<IResFailedOptions, 'isSuccess' | 'timestamp'>
    ) => void;

    logSuccess: (
        resOptions: Omit<IResSuccessOptions, 'isSuccess' | 'timestamp'>
    ) => void;
}

/**
 * 日志记录器.
 */
export interface IHttpClientLogger {
    logFailed: (
        resOptions: Omit<IResFailedOptions, 'isSuccess' | 'timestamp'>
    ) => void;

    logSuccess: (
        resOptions: Omit<IResSuccessOptions, 'isSuccess' | 'timestamp'>
    ) => void;
}

