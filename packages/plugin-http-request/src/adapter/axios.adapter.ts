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
import type {
    AxiosProxyConfig,
    AxiosRequestConfig
} from 'axios';
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
        const axiosConfig = this.buildAxiosConfig(options, url);

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
            throw this.handleAxiosError(error, options);
        }
    }

    /**
     * 构建 Axios 配置
     * @param options 请求选项
     * @param url 完整 URL
     */
    private buildAxiosConfig(options: HttpRequestOptions, url: string): AxiosRequestConfig {
        const axiosConfig: AxiosRequestConfig = {
            method: options.method.toLowerCase(),
            url,
            headers: options.headers || {},
            timeout: options.timeout ?? this.requestConfig.timeout,
            maxRedirects: this.requestConfig.maxRedirects,
            maxContentLength: this.requestConfig.maxResponseBodySize,
            maxBodyLength: this.requestConfig.maxRequestBodySize,
            validateStatus: () => true,
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

        // 配置代理
        this.configureAxiosProxy(axiosConfig, options);

        return axiosConfig;
    }

    /**
     * 配置 Axios 代理
     * @param axiosConfig Axios 配置对象
     * @param options 请求选项
     */
    private configureAxiosProxy(axiosConfig: AxiosRequestConfig, options: HttpRequestOptions): void {
        // 设置代理（全局配置）
        if (this.requestConfig.proxy) {
            axiosConfig.proxy = this.buildProxyConfig(this.requestConfig.proxy);
        } else {
            // 显式的禁用代理, 防止axios默认从环境变量中 HTTP_PROXY、HTTPS_PROXY 读取代理配置. 
            axiosConfig.proxy = false;
        }

        // 设置正向代理（如果请求元数据中包含代理信息）
        const forwardProxyMeta = options.meta?.__forwardProxy;
        if (forwardProxyMeta) {
            this.applyForwardProxy(axiosConfig, forwardProxyMeta);
        }
    }

    /**
     * 应用正向代理配置
     * @param axiosConfig Axios 配置对象
     * @param forwardProxyMeta 正向代理元数据
     */
    private applyForwardProxy(
        axiosConfig: AxiosRequestConfig,
        forwardProxyMeta: { proxyUrl: string, isHttps: boolean }
    ): void {
        const { proxyUrl, isHttps } = forwardProxyMeta;

        if (isHttps) {
            // HTTPS 请求使用 HttpsProxyAgent，并应用证书校验配置
            axiosConfig.httpsAgent = new HttpsProxyAgent(proxyUrl as `https://${ string }`, {
                rejectUnauthorized: this.securityConfig.rejectUnauthorized
            });
            axiosConfig.proxy = false;
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

    /**
     * 处理 Axios 错误
     * @param error 错误对象
     * @param options 请求选项
     */
    private handleAxiosError(error: any, options: HttpRequestOptions): HttpError {
        if (error.isAxiosError) {
            return new HttpError(
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

        return new HttpError(
            error.message || 'Unknown error',
            'UNKNOWN_ERROR',
            undefined,
            undefined,
            options
        );
    }

    /**
     * 构建代理配置
     * @param proxy 代理配置
     */
    private buildProxyConfig(proxy: ProxyConfig): AxiosProxyConfig {
        const config: AxiosProxyConfig = {
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

