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
    // eslint-disable-next-line complexity
    protected async sendRequest<T>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
        if (!this.isAvailable()) {
            throw new Error('Undici is not available. Please install it: npm install undici');
        }

        const fullUrl = this.buildUrl(options.url, options.params);
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

        // 构建 dispatcher 用于代理或 TLS 配置
        // 只有在需要代理或特殊 TLS 配置时才创建 dispatcher
        // 否则不传递 dispatcher，让 undici 使用全局 dispatcher（支持MockAgent）
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
            const { protocol, host, port, auth } = this.requestConfig.proxy;
            let proxyUrl = `${ protocol }://${ host }:${ port }`;

            // 如果有认证信息，添加到 URL 中
            if (auth) {
                const encodedUsername = encodeURIComponent(auth.username);
                const encodedPassword = encodeURIComponent(auth.password);
                proxyUrl = `${ protocol }://${ encodedUsername }:${ encodedPassword }@${ host }:${ port }`;
            }

            dispatcher = new ProxyAgent({
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
        }

        // 设置正向代理（如果请求元数据中包含代理信息，会覆盖全局代理配置）
        const forwardProxyMeta = options.meta?.__forwardProxy;
        if (forwardProxyMeta) {
            const { proxyUrl } = forwardProxyMeta;
            // Undici 使用 ProxyAgent 处理代理，并配置 TLS 选项
            dispatcher = new ProxyAgent({
                uri: proxyUrl,
                connect: {
                    rejectUnauthorized: this.securityConfig.rejectUnauthorized
                }
            });
            this.logger?.debug('Using ProxyAgent for forward proxy (overrides global proxy)', {
                proxyUrl,
                rejectUnauthorized: this.securityConfig.rejectUnauthorized
            });
        }

        // 构建 Undici 请求配置
        // 注意：undici.request() 的第一个参数是完整 URL
        // options 中不包含 origin、path，这些已在 URL 中
        const undiciOptions: Parameters<typeof undici.request>[1] = {
            method: options.method as Dispatcher.HttpMethod,
            headers,
            body,
            bodyTimeout: options.timeout ?? this.requestConfig.timeout,
            headersTimeout: options.timeout ?? this.requestConfig.timeout,
            maxRedirections: this.requestConfig.maxRedirects,
            ...(dispatcher && { dispatcher }),
        };


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

