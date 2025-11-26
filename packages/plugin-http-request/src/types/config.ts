/**
 * 配置相关类型定义
 */

import type { EHttpRequestClientAdapter } from '../enum';
import type { ILogger, IHttpClientLogger, LogFilterConfig } from './logger';

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
    /** 证书校验 **/
    rejectUnauthorized: boolean;
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
 * 日志配置
 */
export interface LoggingConfig {
    /** 启用日志 */
    enabled: boolean;
    /** 自定义日志记录器（通用） */
    logger?: ILogger;
    /** 自定义 HTTP 客户端日志记录器 */
    httpLogger?: IHttpClientLogger;
    /** 记录请求体 */
    logRequestBody: boolean;
    /** 记录响应体 */
    logResponseBody: boolean;
    /** 响应体最大记录长度（字节） */
    bodyMaxLength: number;
    /** 日志过滤器配置 */
    filter?: LogFilterConfig;
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
    /** 最大请求体大小（字节） */
    maxRequestBodySize: number;
    /** 最大响应体大小（字节） */
    maxResponseBodySize: number;
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

