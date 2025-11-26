/**
 * Undici 适配器测试
 */

import { expect } from 'chai';
import { UndiciAdapter } from '../../src/adapters/undici.adapter';
import { HttpError } from '../../src/types';
import type { RequestConfig, SecurityConfig } from '../../src/types';

describe('UndiciAdapter', () => {
    const defaultRequestConfig: RequestConfig = {
        timeout: 5000,
        retries: 0,
        retryDelay: 1000,
        maxRedirects: 5,
        maxBodySize: 10 * 1024 * 1024
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
        it('应该成功发送 GET 请求', async function() {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/get'
                });

                expect(response.status).to.equal(200);
                expect(response.data).to.exist;
                expect(response.headers).to.be.an('object');
                expect(response.statusText).to.be.a('string');
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该正确处理查询参数', async function() {
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

                expect(response.status).to.equal(200);
                const data = response.data as any;
                expect(data.args).to.exist;
                expect(data.args.foo).to.equal('bar');
                expect(data.args.num).to.equal('123');
                expect(data.args.bool).to.equal('true');
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该正确处理自定义请求头', async function() {
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

                expect(response.status).to.equal(200);
                const data = response.data as any;
                expect(data.headers).to.exist;
                expect(data.headers['X-Custom-Header']).to.equal('test-value');
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });

    describe('HTTP POST 请求', () => {
        it('应该成功发送 POST 请求', async function() {
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

                expect(response.status).to.equal(200);
                const data = response.data as any;
                expect(data.json).to.exist;
                expect(data.json.test).to.equal('data');
                expect(data.json.number).to.equal(42);
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该自动设置 Content-Type 为 JSON', async function() {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'POST',
                    url: 'https://httpbin.org/post',
                    body: { test: 'data' }
                });

                expect(response.status).to.equal(200);
                const data = response.data as any;
                expect(data.headers['Content-Type']).to.include('application/json');
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该正确处理字符串请求体', async function() {
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

                expect(response.status).to.equal(200);
                const data = response.data as any;
                expect(data.data).to.equal('plain text data');
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });

    describe('其他 HTTP 方法', () => {
        it('应该支持 PUT 请求', async function() {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'PUT',
                    url: 'https://httpbin.org/put',
                    body: { update: 'data' }
                });

                expect(response.status).to.equal(200);
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该支持 DELETE 请求', async function() {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'DELETE',
                    url: 'https://httpbin.org/delete'
                });

                expect(response.status).to.equal(200);
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该支持 PATCH 请求', async function() {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'PATCH',
                    url: 'https://httpbin.org/patch',
                    body: { patch: 'data' }
                });

                expect(response.status).to.equal(200);
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });

    describe('响应类型处理', () => {
        it('应该正确处理 JSON 响应', async function() {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/json',
                    responseType: 'json'
                });

                expect(response.status).to.equal(200);
                expect(response.data).to.be.an('object');
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该正确处理文本响应', async function() {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/html',
                    responseType: 'text'
                });

                expect(response.status).to.equal(200);
                expect(response.data).to.be.a('string');
                expect(response.data).to.include('html');
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该正确处理非 JSON 文本为文本', async function() {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/html'
                });

                expect(response.status).to.equal(200);
                // 默认应该尝试解析为 JSON，失败后返回文本
                expect(response.data).to.exist;
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });

    describe('HTTP 状态码处理', () => {
        it('应该正确处理 200 OK', async function() {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/status/200'
                });

                expect(response.status).to.equal(200);
                expect(response.statusText).to.equal('OK');
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该正确处理 404 Not Found', async function() {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/status/404'
                });

                expect(response.status).to.equal(404);
                expect(response.statusText).to.equal('Not Found');
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });

        it('应该正确处理 500 Internal Server Error', async function() {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/status/500'
                });

                expect(response.status).to.equal(500);
                expect(response.statusText).to.equal('Internal Server Error');
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });

    describe('超时处理', () => {
        it('应该在超时时抛出错误', async function() {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/delay/10',
                    timeout: 1000 // 1秒超时
                });
                expect.fail('应该抛出超时错误');
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                    return;
                }
                expect(error).to.be.instanceOf(HttpError);
            }
        });
    });

    describe('错误处理', () => {
        it('应该正确处理网络错误', async function() {
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
                debug: () => {},
                info: () => {},
                warn: () => {},
                error: () => {}
            };

            adapter.setLogger(mockLogger);
            expect(adapter).to.exist;
        });
    });

    describe('响应头处理', () => {
        it('应该正确返回响应头', async function() {
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
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });

    describe('重定向处理', () => {
        it('应该正确处理重定向', async function() {
            this.timeout(10000);
            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                const response = await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/redirect/1'
                });

                expect(response.status).to.equal(200);
            } catch (error: any) {
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });

    describe('重试机制', () => {
        it('应该在临时失败时重试', async function() {
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
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.message?.includes('fetch failed')) {
                    console.log('Skipping test: Network unavailable');
                    this.skip();
                }
                throw error;
            }
        });
    });
});

