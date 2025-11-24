/**
 * Axios 适配器实现
 */

import type {
    HttpRequestOptions,
    HttpResponse,
    ProxyConfig
} from '../types';
import { HttpError } from '../types';
import { BaseHttpAdapter } from './base';
import axios from 'axios';
import { EHttpRequestClientAdapter } from '../enum';


/**
 * Axios 适配器
 */
export class AxiosAdapter extends BaseHttpAdapter {
    public readonly name = EHttpRequestClientAdapter.axios as const;

    /**
     * 检查 Axios 是否可用
     */
    public isAvailable(): boolean {
        return !!axios;
    }

    /**
     * 发送请求
     * @param options 请求选项
     */
    protected async sendRequest<T>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
        if (!this.isAvailable()) {
            throw new Error('Axios is not available. Please install it: npm install axios');
        }

        const url = this.buildUrl(options.url, options.params);

        // 构建 Axios 配置
        const axiosConfig: any = {
            method: options.method.toLowerCase(),
            url,
            headers: options.headers || {},
            timeout: options.timeout ?? this.requestConfig.timeout,
            maxRedirects: this.requestConfig.maxRedirects,
            maxContentLength: this.requestConfig.maxBodySize,
            maxBodyLength: this.requestConfig.maxBodySize,
            validateStatus: () => true // 不自动抛出错误，我们自己处理
        };

        // 设置请求体
        if (options.body !== undefined) {
            axiosConfig.data = options.body;
        }

        // 设置响应类型
        if (options.responseType) {
            axiosConfig.responseType = this.mapResponseType(options.responseType);
        }

        // 设置代理
        if (this.requestConfig.proxy) {
            axiosConfig.proxy = this.buildProxyConfig(this.requestConfig.proxy);
        }

        try {
            const startTime = Date.now();
            const axiosResponse = await axios(axiosConfig);
            const duration = Date.now() - startTime;

            this.logger?.debug('HTTP request completed', {
                method: options.method,
                url,
                status: axiosResponse.status,
                duration
            });

            // 转换为标准响应格式
            const response: HttpResponse<T> = {
                status: axiosResponse.status,
                statusText: axiosResponse.statusText,
                headers: this.normalizeHeaders(axiosResponse.headers),
                data: axiosResponse.data,
                config: options
            };

            return response;
        } catch (error: any) {
            // 转换为标准错误格式
            if (error.isAxiosError) {
                throw new HttpError(
                    error.message,
                    error.code || 'AXIOS_ERROR',
                    error.response?.status,
                    error.response ? {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        headers: this.normalizeHeaders(error.response.headers),
                        data: error.response.data,
                        config: options
                    } : undefined,
                    options
                );
            }

            throw new HttpError(
                error.message || 'Unknown error',
                'UNKNOWN_ERROR',
                undefined,
                undefined,
                options
            );
        }
    }

    /**
     * 映射响应类型
     * @param type 标准响应类型
     */
    private mapResponseType(type: string): string {
        const mapping: Record<string, string> = {
            json: 'json',
            text: 'text',
            stream: 'stream',
            arraybuffer: 'arraybuffer'
        };
        return mapping[type] || 'json';
    }

    /**
     * 构建代理配置
     * @param proxy 代理配置
     */
    private buildProxyConfig(proxy: ProxyConfig): any {
        const config: any = {
            host: proxy.host,
            port: proxy.port,
            protocol: proxy.protocol
        };

        if (proxy.auth) {
            config.auth = {
                username: proxy.auth.username,
                password: proxy.auth.password
            };
        }

        return config;
    }
}

