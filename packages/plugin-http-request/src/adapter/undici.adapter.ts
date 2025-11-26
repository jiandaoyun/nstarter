/**
 * Undici 适配器实现
 */

import type {
    HttpRequestOptions,
    HttpResponse,
    ResponseType,
} from '../types';
import { HttpError } from '../types';
import { BaseHttpAdapter } from './base';
import undici, {
    ProxyAgent,
    type Dispatcher
} from 'undici';
import { EHttpRequestClientAdapter } from '../enum';
import { STATUS_CODES } from 'http';

/**
 * Undici 适配器
 */
export class UndiciAdapter extends BaseHttpAdapter {
    public readonly name = EHttpRequestClientAdapter.undici as const;

    /**
     * 检查 Undici 是否可用
     */
    public isAvailable(): boolean {
        return !!undici;
    }

    /**
     * 发送请求
     * @param options 请求选项
     */
    protected async sendRequest<T>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
        if (!this.isAvailable()) {
            throw new Error('Undici is not available. Please install it: npm install undici');
        }

        const fullUrl = this.buildUrl(options.url, options.params);
        
        // 解析 URL 以分离 origin 和 pathname
        const parsedUrl = new URL(fullUrl);
        const origin = parsedUrl.origin;
        const pathname = parsedUrl.pathname + parsedUrl.search;

        // 准备 headers，将 number 类型转换为 string
        const headers: Record<string, string | string[]> = {};
        if (options.headers) {
            for (const [key, value] of Object.entries(options.headers)) {
                headers[key] = typeof value === 'number' ? String(value) : value;
            }
        }

        // 设置请求体
        let body: Dispatcher.DispatchOptions['body'];
        if (options.body !== undefined) {
            if (typeof options.body === 'object' && !(options.body instanceof Buffer)) {
                body = JSON.stringify(options.body);
                // 自动设置 Content-Type
                if (!headers['content-type'] && !headers['Content-Type']) {
                    headers['Content-Type'] = 'application/json';
                }
            } else {
                body = options.body;
            }
        }

        // 构建 Undici 请求配置
        // 注意：undici.request() 的第一个参数是 origin，path 在 options 中指定
        const undiciOptions: Dispatcher.RequestOptions & {
            dispatcher?: Dispatcher,
            connect?: { rejectUnauthorized?: boolean }
        } = {
            path: pathname,
            method: options.method as Dispatcher.HttpMethod,
            headers,
            body,
            bodyTimeout: options.timeout ?? this.requestConfig.timeout,
            headersTimeout: options.timeout ?? this.requestConfig.timeout,
            maxRedirections: this.requestConfig.maxRedirects,
            // 设置 TLS 连接选项以支持证书校验配置
            connect: {
                rejectUnauthorized: this.securityConfig.rejectUnauthorized
            }
        };

        // 设置正向代理（如果请求元数据中包含代理信息）
        const forwardProxyMeta = options.meta?.__forwardProxy;
        if (forwardProxyMeta) {
            const { proxyUrl } = forwardProxyMeta;
            // Undici 使用 ProxyAgent 处理代理
            undiciOptions.dispatcher = new ProxyAgent(proxyUrl);
            this.logger?.debug('Using ProxyAgent for request', { proxyUrl });
        }

        try {
            const startTime = Date.now();
            const response = await undici.request(origin, undiciOptions);
            const duration = Date.now() - startTime;

            this.logger?.debug('HTTP request completed', {
                method: options.method,
                url: fullUrl,
                status: response.statusCode,
                duration
            });

            // 读取响应体
            const data = await this.readResponseBody<T>(response, options.responseType);

            // 转换为标准响应格式
            const httpResponse: HttpResponse<T> = {
                status: response.statusCode,
                statusText: this.getStatusText(response.statusCode),
                headers: this.normalizeHeaders(response.headers),
                data,
                config: options
            };

            return httpResponse;
        } catch (error: unknown) {
            // 转换为标准错误格式
            const errorMessage = error instanceof Error ? error.message : 'Undici request failed';
            const errorCode = (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string')
                ? error.code
                : 'UNDICI_ERROR';

            throw new HttpError(
                errorMessage,
                errorCode,
                undefined,
                undefined,
                options
            );
        }
    }

    /**
     * 读取响应体
     * @param response Undici 响应对象
     * @param responseType 响应类型
     */
    private async readResponseBody<T>(response: Dispatcher.ResponseData, responseType?: ResponseType): Promise<T> {
        try {
            switch (responseType) {
                case 'text': {
                    return (await response.body.text()) as T;
                }
                case 'arraybuffer': {
                    return (await response.body.arrayBuffer()) as T;
                }
                case 'stream': {
                    return response.body as T;
                }
                case 'blob': {
                    return (await response.body.blob()) as T;
                }
                case 'formdata': {
                    return (await response.body.formData()) as T;
                }
                case 'json': {
                    return (await response.body.json()) as T;
                }
                default: {
                    const text = await response.body.text();
                    try {
                        return JSON.parse(text) as T;
                    } catch {
                        // 如果不是有效的 JSON，返回原文本
                        return text as T;
                    }
                }

            }
        } catch (error) {
            throw new Error(`Failed to read response body: ${ error instanceof Error ? error.message : String(error) }`);
        }
    }

    /**
     * 获取状态文本
     * @param statusCode 状态码
     */
    private getStatusText(statusCode: number): string {
        return STATUS_CODES[statusCode] || 'Unknown';
    }
}

