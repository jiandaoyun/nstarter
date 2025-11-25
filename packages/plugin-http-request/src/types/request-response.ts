/**
 * 请求和响应类型定义
 */

/**
 * HTTP 方法
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

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

