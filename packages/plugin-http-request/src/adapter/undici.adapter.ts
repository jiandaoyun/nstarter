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
    Agent,
    ProxyAgent,
    type Dispatcher
} from 'undici';
import { STATUS_CODES } from 'http';
import { EClientAdapter } from '../const';

/**
 * Undici 适配器
 */
export class UndiciAdapter extends BaseHttpAdapter {
    public readonly name = EClientAdapter.undici as const;

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
        const headers = this.prepareHeaders(options.headers);
        const body = this.prepareBody(options.body, headers);
        const dispatcher = this.buildDispatcher(options);
        const undiciOptions = this.buildUndiciOptions(options, headers, body, dispatcher);

        try {
            const startTime = Date.now();
            const response = await undici.request(fullUrl, undiciOptions);
            const duration = Date.now() - startTime;

            this.logger?.debug('HTTP request completed', {
                method: options.method,
                url: fullUrl,
                status: response.statusCode,
                duration
            });

            const data = await this.readResponseBody<T>(response, options.responseType);

            const httpResponse: HttpResponse<T> = {
                status: response.statusCode,
                statusText: this.getStatusText(response.statusCode),
                headers: this.normalizeHeaders(response.headers),
                data,
                config: options
            };

            return httpResponse;
        } catch (error: unknown) {
            throw this.handleUndiciError(error, options);
        }
    }

    /**
     * 准备请求头
     * @param headers 原始请求头
     */
    private prepareHeaders(headers?: Record<string, string | number | string[]>): Record<string, string | string[]> {
        const prepared: Record<string, string | string[]> = {};
        if (headers) {
            for (const [key, value] of Object.entries(headers)) {
                prepared[key] = typeof value === 'number' ? String(value) : value;
            }
        }
        return prepared;
    }

    /**
     * 准备请求体
     * @param body 原始请求体
     * @param headers 请求头
     */
    private prepareBody(body: any, headers: Record<string, string | string[]>): Dispatcher.DispatchOptions['body'] {
        if (body === undefined) {
            return undefined;
        }

        if (typeof body === 'object' && !(body instanceof Buffer)) {
            // 自动设置 Content-Type
            if (!headers['content-type'] && !headers['Content-Type']) {
                headers['Content-Type'] = 'application/json';
            }
            return JSON.stringify(body);
        }

        return body;
    }

    /**
     * 构建 Dispatcher（代理或 TLS 配置）
     * @param options 请求选项
     */
    private buildDispatcher(options: HttpRequestOptions): Dispatcher | undefined {
        let dispatcher: Dispatcher | undefined;

        // 如果 rejectUnauthorized 为 false，需要创建 Agent 来设置 TLS 选项
        if (!this.securityConfig.rejectUnauthorized) {
            dispatcher = new Agent({
                connect: {
                    rejectUnauthorized: false
                }
            });
        }

        // 有代理时，创建 ProxyAgent
        if (this.requestConfig.proxy) {
            dispatcher = this.createGlobalProxyAgent();
        }

        // 设置正向代理（如果请求元数据中包含代理信息，会覆盖全局代理配置）
        const forwardProxyMeta = options.meta?.__forwardProxy;
        if (forwardProxyMeta) {
            dispatcher = this.createForwardProxyAgent(forwardProxyMeta.proxyUrl);
        }

        return dispatcher;
    }

    /**
     * 创建全局代理 Agent
     */
    private createGlobalProxyAgent(): ProxyAgent {
        const { protocol, host, port, auth } = this.requestConfig.proxy!;
        let proxyUrl = `${ protocol }://${ host }:${ port }`;

        if (auth) {
            const encodedUsername = encodeURIComponent(auth.username);
            const encodedPassword = encodeURIComponent(auth.password);
            proxyUrl = `${ protocol }://${ encodedUsername }:${ encodedPassword }@${ host }:${ port }`;
        }

        const agent = new ProxyAgent({
            uri: proxyUrl,
            connect: {
                rejectUnauthorized: this.securityConfig.rejectUnauthorized
            }
        });

        this.logger?.debug('Using ProxyAgent with global proxy config', {
            host,
            port,
            protocol,
            rejectUnauthorized: this.securityConfig.rejectUnauthorized
        });

        return agent;
    }

    /**
     * 创建正向代理 Agent
     * @param proxyUrl 代理 URL
     */
    private createForwardProxyAgent(proxyUrl: string): ProxyAgent {
        const agent = new ProxyAgent({
            uri: proxyUrl,
            connect: {
                rejectUnauthorized: this.securityConfig.rejectUnauthorized
            }
        });

        this.logger?.debug('Using ProxyAgent for forward proxy (overrides global proxy)', {
            proxyUrl,
            rejectUnauthorized: this.securityConfig.rejectUnauthorized
        });

        return agent;
    }

    /**
     * 构建 Undici 请求选项
     */
    private buildUndiciOptions(
        options: HttpRequestOptions,
        headers: Record<string, string | string[]>,
        body: Dispatcher.DispatchOptions['body'],
        dispatcher?: Dispatcher
    ): Parameters<typeof undici.request>[1] {
        return {
            method: options.method as Dispatcher.HttpMethod,
            headers,
            body,
            bodyTimeout: options.timeout ?? this.requestConfig.timeout,
            headersTimeout: options.timeout ?? this.requestConfig.timeout,
            maxRedirections: this.requestConfig.maxRedirects,
            ...(dispatcher && { dispatcher }),
        };
    }

    /**
     * 处理 Undici 错误
     * @param error 错误对象
     * @param options 请求选项
     */
    private handleUndiciError(error: unknown, options: HttpRequestOptions): HttpError {
        const errorMessage = error instanceof Error ? error.message : 'Undici request failed';
        const errorCode = (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string')
            ? error.code
            : 'UNDICI_ERROR';

        return new HttpError(
            errorMessage,
            errorCode,
            undefined,
            undefined,
            options
        );
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
                    // undici 返回 BodyReadable (继承自 Node.js Readable)
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

