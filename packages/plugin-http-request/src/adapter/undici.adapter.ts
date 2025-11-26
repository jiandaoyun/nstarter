/**
 * Undici 适配器实现
 */

import type {
    HttpRequestOptions,
    HttpResponse,
} from '../types';
import { HttpError } from '../types';
import { BaseHttpAdapter } from './base';
import undici, { ProxyAgent } from 'undici';
import { EHttpRequestClientAdapter } from '../enum';


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

        const url = this.buildUrl(options.url, options.params);

        // 构建 Undici 请求配置
        const undiciOptions: any = {
            method: options.method,
            headers: options.headers || {},
            bodyTimeout: options.timeout ?? this.requestConfig.timeout,
            headersTimeout: options.timeout ?? this.requestConfig.timeout,
            maxRedirections: this.requestConfig.maxRedirects,
            // 设置 TLS 连接选项以支持证书校验配置
            connect: {
                rejectUnauthorized: this.securityConfig.rejectUnauthorized
            }
        };

        // 设置请求体
        if (options.body !== undefined) {
            if (typeof options.body === 'object' && !(options.body instanceof Buffer)) {
                undiciOptions.body = JSON.stringify(options.body);
                // 自动设置 Content-Type
                if (!undiciOptions.headers['content-type'] && !undiciOptions.headers['Content-Type']) {
                    undiciOptions.headers['Content-Type'] = 'application/json';
                }
            } else {
                undiciOptions.body = options.body;
            }
        }

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
            const response = await undici.request(url, undiciOptions);
            const duration = Date.now() - startTime;

            this.logger?.debug('HTTP request completed', {
                method: options.method,
                url,
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
        } catch (error: any) {
            // 转换为标准错误格式
            throw new HttpError(
                error.message || 'Undici request failed',
                error.code || 'UNDICI_ERROR',
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
    private async readResponseBody<T>(response: any, responseType?: string): Promise<T> {
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
                case 'json':
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
        const statusTexts: Record<number, string> = {
            200: 'OK',
            201: 'Created',
            202: 'Accepted',
            204: 'No Content',
            400: 'Bad Request',
            401: 'Unauthorized',
            403: 'Forbidden',
            404: 'Not Found',
            405: 'Method Not Allowed',
            408: 'Request Timeout',
            429: 'Too Many Requests',
            500: 'Internal Server Error',
            502: 'Bad Gateway',
            503: 'Service Unavailable',
            504: 'Gateway Timeout'
        };

        return statusTexts[statusCode] || 'Unknown';
    }
}

