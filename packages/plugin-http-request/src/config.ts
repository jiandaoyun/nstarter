/**
 * 配置管理
 */

import type {
  HttpClientConfig,
  PartialHttpClientConfig,
  SecurityConfig,
  LoggingConfig,
  RequestConfig
} from './types';
import { EHttpRequestClientAdapter } from './enum';

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
  maxBodySize: 50 * 1024 * 1024 // 50MB
};

/**
 * 默认 HTTP 客户端配置
 */
export const DEFAULT_HTTP_CLIENT_CONFIG: HttpClientConfig = {
  adapter: EHttpRequestClientAdapter.axios,
  security: DEFAULT_SECURITY_CONFIG,
  logging: DEFAULT_LOGGING_CONFIG,
  request: DEFAULT_REQUEST_CONFIG
};

/**
 * 合并配置
 * @param userConfig 用户配置
 * @returns 完整配置
 */
export function mergeConfig(userConfig: PartialHttpClientConfig = {}): HttpClientConfig {
  return {
    adapter: userConfig.adapter ?? DEFAULT_HTTP_CLIENT_CONFIG.adapter,
    security: {
      ...DEFAULT_SECURITY_CONFIG,
      ...userConfig.security
    },
    logging: {
      ...DEFAULT_LOGGING_CONFIG,
      ...userConfig.logging
    },
    request: {
      ...DEFAULT_REQUEST_CONFIG,
      ...userConfig.request
    }
  };
}

/**
 * 验证配置
 * @param config 配置
 * @throws {Error} 配置无效时抛出错误
 */
export function validateConfig(config: HttpClientConfig): void {
  // 验证适配器
  if (!['axios', 'undici'].includes(config.adapter)) {
    throw new Error(`Invalid adapter: ${ config.adapter }. Must be 'axios' or 'undici'.`);
  }

  // 验证安全配置
  if (config.security.dnsCacheTtl < 0) {
    throw new Error('DNS cache TTL must be non-negative.');
  }

  // 验证请求配置
  if (config.request.timeout <= 0) {
    throw new Error('Timeout must be positive.');
  }

  if (config.request.retries < 0) {
    throw new Error('Retries must be non-negative.');
  }

  if (config.request.retryDelay < 0) {
    throw new Error('Retry delay must be non-negative.');
  }

  if (config.request.maxRedirects < 0) {
    throw new Error('Max redirects must be non-negative.');
  }

  if (config.request.maxBodySize <= 0) {
    throw new Error('Max body size must be positive.');
  }

  // 验证日志配置
  if (config.logging.bodyMaxLength <= 0) {
    throw new Error('Body max length must be positive.');
  }
}

