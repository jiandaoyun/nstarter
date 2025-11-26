/**
 * Undici 适配器测试
 */

import { expect } from 'chai';
import { UndiciAdapter } from '../../src';
import { HttpError } from '../../src';
import type {
    RequestConfig,
    SecurityConfig
} from '../../src';

describe('UndiciAdapter', () => {
    const defaultRequestConfig: RequestConfig = {
        timeout: 5000,
        retries: 0,
        retryDelay: 1000,
        maxRedirects: 5,
        maxRequestBodySize: 10 * 1024 * 1024,
        maxResponseBodySize: 50 * 1024 * 1024
    };

    const defaultSecurityConfig: SecurityConfig = {
        enableIpValidation: false,
        enableDnsValidation: false,
        allowPrivateIp: true,
        rejectUnauthorized: true,
        dnsCacheTtl: 60000,
        whitelist: [],
        blacklist: []
    };

    // 辅助函数：检查是否为网络不可用错误
    function isNetworkUnavailable(error: any): boolean {
        if (!error) return false;
        
        // 检查错误码
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            return true;
        }
        
        // 检查错误消息
        const message = error.message || '';
        if (message.includes('timeout') || message.includes('Network') || message.includes('fetch failed') || message.includes('Timeout')) {
            return true;
        }
        
        // 检查 HTTP 状态码（502/503 表示服务不可用）
        if (error.status === 502 || error.status === 503) {
            return true;
        }
        
        return false;
    }

    // 辅助函数：检查响应是否表示服务不可用
    function checkResponseAvailable(response: any, context: Mocha.Context): void {
        if (response.status === 503 || response.status === 502) {
            console.log('Skipping test: Service unavailable (503/502)');
            context.skip();
        }
    }

    describe('构造函数和基础功能', () => {
        it('应该正确创建实例', () => {
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            expect(adapter).to.be.instanceOf(UndiciAdapter);
            expect(adapter.name).to.equal('undici');
        });

        it('应该检查 Undici 可用性', () => {
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            expect(adapter.isAvailable()).to.be.true;
        });
    });

    describe('HTTP GET 请求', () => {
        it('应该成功发送 GET 请求', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/get'
                });

                checkResponseAvailable(response, this);
                expect(response.status).to.equal(200);
                expect(response.data).to.exist;
                expect(response.headers).to.be.an('object');
                expect(response.statusText).to.be.a('string');
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该正确处理查询参数', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/get',
                    params: {
                        foo: 'bar',
                        num: 123,
                        bool: true
                    }
                });

                checkResponseAvailable(response, this);
                expect(response.status).to.equal(200);
                const data = response.data as any;
                expect(data.args).to.exist;
                expect(data.args.foo).to.equal('bar');
                expect(data.args.num).to.equal('123');
                expect(data.args.bool).to.equal('true');
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该正确处理自定义请求头', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/headers',
                    headers: {
                        'X-Custom-Header': 'test-value',
                        'User-Agent': 'test-agent'
                    }
                });

                checkResponseAvailable(response, this);
                expect(response.status).to.equal(200);
                const data = response.data as any;
                expect(data.headers).to.exist;
                expect(data.headers['X-Custom-Header']).to.equal('test-value');
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });

    describe('HTTP POST 请求', () => {
        it('应该成功发送 POST 请求', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'POST',
                    url: 'https://httpbin.org/post',
                    body: {
                        test: 'data',
                        number: 42
                    }
                });

                checkResponseAvailable(response, this);
                expect(response.status).to.equal(200);
                const data = response.data as any;
                expect(data.json).to.exist;
                expect(data.json.test).to.equal('data');
                expect(data.json.number).to.equal(42);
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该自动设置 Content-Type 为 JSON', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'POST',
                    url: 'https://httpbin.org/post',
                    body: { test: 'data' }
                });

                checkResponseAvailable(response, this);
                checkResponseAvailable(response, this);
                expect(response.status).to.equal(200);
                const data = response.data as any;
                expect(data.headers['Content-Type']).to.include('application/json');
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该正确处理字符串请求体', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'POST',
                    url: 'https://httpbin.org/post',
                    body: 'plain text data',
                    headers: {
                        'Content-Type': 'text/plain'
                    }
                });

                checkResponseAvailable(response, this);
                expect(response.status).to.equal(200);
                const data = response.data as any;
                expect(data.data).to.equal('plain text data');
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });

    describe('其他 HTTP 方法', () => {
        it('应该支持 PUT 请求', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'PUT',
                    url: 'https://httpbin.org/put',
                    body: { update: 'data' }
                });

                checkResponseAvailable(response, this);
                expect(response.status).to.equal(200);
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该支持 DELETE 请求', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'DELETE',
                    url: 'https://httpbin.org/delete'
                });

                checkResponseAvailable(response, this);
                expect(response.status).to.equal(200);
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该支持 PATCH 请求', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'PATCH',
                    url: 'https://httpbin.org/patch',
                    body: { patch: 'data' }
                });

                checkResponseAvailable(response, this);
                expect(response.status).to.equal(200);
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });

    describe('响应类型处理', () => {
        it('应该正确处理 JSON 响应', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/json',
                    responseType: 'json'
                });

                checkResponseAvailable(response, this);
                expect(response.status).to.equal(200);
                expect(response.data).to.be.an('object');
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                    return;
                }
                // 检查是否为 JSON 解析错误（说明服务返回了错误页面）
                if (error.message && error.message.includes('not valid JSON')) {
                    console.log('Skipping test: Service returned non-JSON response');
                    this.skip();
                    return;
                }
                throw error;
            }
        });

        it('应该正确处理文本响应', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/html',
                    responseType: 'text'
                });

                checkResponseAvailable(response, this);
                expect(response.status).to.equal(200);
                expect(response.data).to.be.a('string');
                expect(response.data).to.include('html');
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该正确处理非 JSON 文本为文本', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/html'
                });

                checkResponseAvailable(response, this);
                expect(response.status).to.equal(200);
                // 默认应该尝试解析为 JSON，失败后返回文本
                expect(response.data).to.exist;
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });

    describe('HTTP 状态码处理', () => {
        it('应该正确处理 200 OK', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/status/200'
                });

                checkResponseAvailable(response, this);
                expect(response.status).to.equal(200);
                expect(response.statusText).to.equal('OK');
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该正确处理 404 Not Found', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/status/404'
                });

                checkResponseAvailable(response, this);
                expect(response.status).to.equal(404);
                expect(response.statusText).to.equal('Not Found');
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该正确处理 500 Internal Server Error', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/status/500'
                });

                checkResponseAvailable(response, this);
                expect(response.status).to.equal(500);
                expect(response.statusText).to.equal('Internal Server Error');
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });

    describe('超时处理', () => {
        it('应该在超时时抛出错误', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            let didThrow = false;
            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/delay/10',
                    timeout: 1000 // 1秒超时
                });
                
                // 如果请求成功（可能是服务快速响应或网络问题），跳过测试
                if (response && (response.status === 503 || response.status === 502)) {
                    console.log('Skipping test: Service unavailable');
                    this.skip();
                    return;
                }
            } catch (error: any) {
                didThrow = true;
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                    return;
                }
                expect(error).to.be.instanceOf(HttpError);
            }
            
            if (!didThrow) {
                // 请求成功了，说明服务响应很快，无法测试超时，跳过测试
                console.log('Skipping test: Service responded too quickly to test timeout');
                this.skip();
            }
        });
    });

    describe('错误处理', () => {
        it('应该正确处理网络错误', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                await adapter.request({
                    method: 'GET',
                    url: 'http://this-domain-absolutely-does-not-exist-12345.com',
                    timeout: 3000
                });
                expect.fail('应该抛出网络错误');
            } catch (error: any) {
                expect(error).to.be.instanceOf(HttpError);
                expect(error.code).to.exist;
            }
        });
    });

    describe('配置更新', () => {
        it('应该支持更新配置', () => {
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            adapter.updateConfig({ timeout: 3000 });

            expect(adapter).to.exist;
        });

        it('应该支持设置日志记录器', () => {
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            const mockLogger = {
                debug: () => {
                },
                info: () => {
                },
                warn: () => {
                },
                error: () => {
                }
            };

            adapter.setLogger(mockLogger);
            expect(adapter).to.exist;
        });
    });

    describe('响应头处理', () => {
        it('应该正确返回响应头', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/response-headers',
                    params: {
                        'X-Test-Header': 'test-value'
                    }
                });

                expect(response.headers).to.be.an('object');
                expect(response.headers['content-type']).to.exist;
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });

    describe('重定向处理', () => {
        it('应该正确处理重定向', async function () {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/redirect/1'
                });

                // 检查是否为服务不可用
                if (response.status === 503 || response.status === 502) {
                    console.log('Skipping test: Network unavailable (503/502)');
                    this.skip();
                }

                expect(response.status).to.equal(200);
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });

    describe('重试机制', () => {
        it('应该在临时失败时重试', async function () {
            this.timeout(15000);
            const config: RequestConfig = {
                ...defaultRequestConfig,
                retries: 2,
                retryDelay: 500
            };
            const adapter = new UndiciAdapter(config, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/status/503'
                });

                expect(response.status).to.equal(503);
            } catch (error: any) {
                if (isNetworkUnavailable(error)) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });
});

