import type {
    HttpClientConfig,
    LoggingConfig,
    RequestConfig,
    SecurityConfig
} from '../types';
import { EClientAdapter } from './enum.const';

/**
 * DNS 缓存最大 TTL（毫秒）- 24 小时
 * 避免过长的缓存时间导致内存积压
 */
export const MAX_DNS_CACHE_TTL = 24 * 60 * 60 * 1000; // 86400000ms (24 小时)

/**
 * 默认安全配置
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    rejectUnauthorized: true,
    enableDnsValidation: true,
    enableIpValidation: true,
    allowPrivateIp: false,
    whitelist: [],
    blacklist: [],
    dnsCacheTtl: 60000 // 60 秒
};

/**
 * 默认日志配置
 */
export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
    enabled: true,
    logRequestBody: true,
    logResponseBody: true,
    bodyMaxLength: 1024 * 1024 // 1MB
};

/**
 * 默认请求配置
 */
export const DEFAULT_REQUEST_CONFIG: RequestConfig = {
    timeout: 30000, // 30 秒
    retries: 0,
    retryDelay: 1000, // 1 秒
    maxRedirects: 5,
    maxRequestBodySize: 10 * 1024 * 1024, // 10MB
    maxResponseBodySize: 50 * 1024 * 1024 // 50MB
};

/**
 * 默认 HTTP 客户端配置
 */
export const DEFAULT_HTTP_CLIENT_CONFIG: HttpClientConfig = {
    adapter: EClientAdapter.axios,
    security: DEFAULT_SECURITY_CONFIG,
    logging: DEFAULT_LOGGING_CONFIG,
    request: DEFAULT_REQUEST_CONFIG
};
