/**
 * 适配器相关类型定义
 */

import type { EHttpRequestClientAdapter } from '../enum';
import type { HttpRequestOptions, HttpResponse } from './request_response';
import type { RequestConfig } from './config';

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

