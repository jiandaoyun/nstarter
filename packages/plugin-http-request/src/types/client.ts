/**
 * 客户端相关类型定义
 */

import type { EHttpRequestClientAdapter } from '../enum';
import type { HttpRequestOptions, HttpResponse } from './request_response';

/**
 * 正向代理配置
 */
export interface IForwardProxy {
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
     * 清空 DNS 缓存
     */
    clearDnsCache: () => void;

    /**
     * 获取 DNS 缓存大小
     * @returns 缓存条目数量
     */
    getDnsCacheSize: () => number;
}

