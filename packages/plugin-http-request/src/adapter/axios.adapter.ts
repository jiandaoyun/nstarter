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
import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import * as https from 'https';
import { EClientAdapter } from '../const';


/**
 * Axios 适配器
 */
export class AxiosAdapter extends BaseHttpAdapter {
    public readonly name = EClientAdapter.axios as const;

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
        const axiosConfig: AxiosRequestConfig = {
            method: options.method.toLowerCase(),
            url,
            headers: options.headers || {},
            timeout: options.timeout ?? this.requestConfig.timeout,
            maxRedirects: this.requestConfig.maxRedirects,
            maxContentLength: this.requestConfig.maxResponseBodySize,
            maxBodyLength: this.requestConfig.maxRequestBodySize,
            // 接受所有 HTTP 状态码（包括 4xx 和 5xx），不将它们视为错误
            validateStatus: () => true,
            // 设置 HTTPS Agent 以支持证书校验配置
            httpsAgent: new https.Agent({
                rejectUnauthorized: this.securityConfig.rejectUnauthorized
            })
        };

        // 设置请求体
        if (options.body !== undefined) {
            axiosConfig.data = options.body;
        }

        // 设置响应类型
        if (options.responseType) {
            axiosConfig.responseType = options.responseType;
        }

        // 设置代理（全局配置）
        if (this.requestConfig.proxy) {
            axiosConfig.proxy = this.buildProxyConfig(this.requestConfig.proxy);
        }

        // 设置正向代理（如果请求元数据中包含代理信息）
        const forwardProxyMeta = options.meta?.__forwardProxy;
        if (forwardProxyMeta) {
            const { proxyUrl, isHttps } = forwardProxyMeta;

            if (isHttps) {
                // HTTPS 请求使用 HttpsProxyAgent，并应用证书校验配置
                axiosConfig.httpsAgent = new HttpsProxyAgent<`https://${ string }`>(proxyUrl, {
                    rejectUnauthorized: this.securityConfig.rejectUnauthorized
                });
                this.logger?.debug('Using HttpsProxyAgent for HTTPS request', {
                    proxyUrl,
                    rejectUnauthorized: this.securityConfig.rejectUnauthorized
                });
            } else {
                // HTTP 请求直接设置 proxy
                const parsedProxyUrl = new URL(proxyUrl);
                axiosConfig.proxy = {
                    host: parsedProxyUrl.hostname,
                    port: Number(parsedProxyUrl.port),
                    protocol: 'http'
                };

                // 处理代理认证
                if (parsedProxyUrl.username && parsedProxyUrl.password) {
                    axiosConfig.proxy.auth = {
                        username: decodeURIComponent(parsedProxyUrl.username),
                        password: decodeURIComponent(parsedProxyUrl.password)
                    };
                }

                this.logger?.debug('Using proxy for HTTP request', {
                    host: axiosConfig.proxy.host,
                    port: axiosConfig.proxy.port
                });
            }
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

