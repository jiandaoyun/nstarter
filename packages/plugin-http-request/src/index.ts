/**
 * @fx/http-client
 * 统一的 HTTP 客户端，提供 DNS/SSRF 防护、可配置日志、适配器支持
 */

// 主类
export { HttpClient } from './client';

// 类型定义
export type {
    HttpMethod,
    ProxyConfig,
    SecurityConfig,
    ILogger,
    IHttpClientLogger,
    ILogFilter,
    LogFilterConfig,
    IResFailedOptions,
    IResSuccessOptions,
    LoggingConfig,
    RequestConfig,
    HttpClientConfig,
    PartialHttpClientConfig,
    HttpRequestOptions,
    HttpResponse,
    DnsResult,
    IpValidationResult,
    UrlValidationResult,
    IHttpAdapter,
    IHttpClient
} from './types';

// 错误类
export {
    HttpError,
    SecurityError
} from './types';

// 配置
export {
    DEFAULT_SECURITY_CONFIG,
    DEFAULT_LOGGING_CONFIG,
    DEFAULT_REQUEST_CONFIG,
    DEFAULT_HTTP_CLIENT_CONFIG,
    mergeConfig,
    validateConfig
} from './config';

// 安全模块
export { IpValidator } from './security/ip.validator';
export { DnsValidator } from './security/dns.validator';
export { UrlValidator } from './security/url.validator';
export { SsrfGuard } from './security/ssrf.guard';
export type { SsrfGuardResult } from './security/ssrf.guard';

// 日志模块
export {
    BaseLogger,
    NullLogger,
    LogLevel
} from './logger/base';
export { ConsoleLogger } from './logger/console.logger';
export { LogFilter } from './logger/log.filter';
export { HttpClientLogger } from './logger/http_client.logger';
export type { HttpClientLoggerConfig } from './logger/http_client.logger';

// 适配器
export { BaseHttpAdapter } from './adapters/base';
export { AxiosAdapter } from './adapters/axios.adapter';
export { UndiciAdapter } from './adapters/undici.adapter';

// 工具
export {
    ipv4ToNumber,
    ipv6ToBigInt,
    normalizeIpv6,
    isIpv4InRange,
    isIpv6InRange,
    isIpInRange,
    isIpInAnyRange
} from './utils/ip.range';

