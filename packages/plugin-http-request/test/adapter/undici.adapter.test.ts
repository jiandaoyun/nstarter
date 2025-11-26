/**
 * Undici 适配器测试
 * 使用 undici 官方的 MockAgent 进行 HTTP mock
 */

import { expect } from 'chai';
import { MockAgent, setGlobalDispatcher, getGlobalDispatcher } from 'undici';
import { UndiciAdapter } from '../../src';
import { HttpError } from '../../src';
import type {
    RequestConfig,
    SecurityConfig
} from '../../src';

describe('UndiciAdapter', () => {
    let mockAgent: MockAgent;
    let originalDispatcher: any;

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

    beforeEach(() => {
        // 保存原始 dispatcher
        originalDispatcher = getGlobalDispatcher();
        // 创建 MockAgent 并设置为全局 dispatcher
        mockAgent = new MockAgent();
        mockAgent.disableNetConnect();
        setGlobalDispatcher(mockAgent);
    });

    afterEach(async () => {
        // 关闭 mock agent
        await mockAgent.close();
        // 恢复原始 dispatcher
        if (originalDispatcher) {
            setGlobalDispatcher(originalDispatcher);
        }
    });

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
        it('应该成功发送 GET 请求', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/get',
                method: 'GET'
            }).reply(200, {
                args: {},
                headers: { 'User-Agent': 'undici' },
                url: 'https://httpbin.org/get'
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.org/get'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.exist;
            expect(response.headers).to.be.an('object');
            expect(response.statusText).to.be.a('string');
        });

        it('应该正确处理查询参数', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/get?foo=bar&num=123&bool=true',
                method: 'GET'
            }).reply(200, {
                args: { foo: 'bar', num: '123', bool: 'true' },
                url: 'https://httpbin.org/get?foo=bar&num=123&bool=true'
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
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
        });

        it('应该正确处理自定义请求头', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/headers',
                method: 'GET',
                headers: {
                    'x-custom-header': 'test-value',
                    'user-agent': 'test-agent'
                }
            }).reply(200, {
                headers: {
                    'X-Custom-Header': 'test-value',
                    'User-Agent': 'test-agent'
                }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
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
        });
    });

    describe('HTTP POST 请求', () => {
        it('应该成功发送 POST 请求', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/post',
                method: 'POST',
                body: JSON.stringify({ test: 'data', number: 42 })
            }).reply(200, {
                json: { test: 'data', number: 42 }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
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
        });

        it('应该自动设置 Content-Type 为 JSON', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/post',
                method: 'POST',
                body: JSON.stringify({ test: 'data' })
            }).reply(200, {
                headers: { 'Content-Type': 'application/json' }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'POST',
                url: 'https://httpbin.org/post',
                body: { test: 'data' }
            });

            expect(response.status).to.equal(200);
            const data = response.data as any;
            expect(data.headers['Content-Type']).to.include('application/json');
        });

        it('应该正确处理字符串请求体', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/post',
                method: 'POST',
                body: 'plain text data'
            }).reply(200, {
                data: 'plain text data'
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
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
        });
    });

    describe('其他 HTTP 方法', () => {
        it('应该支持 PUT 请求', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/put',
                method: 'PUT',
                body: JSON.stringify({ update: 'data' })
            }).reply(200, {
                json: { update: 'data' }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'PUT',
                url: 'https://httpbin.org/put',
                body: { update: 'data' }
            });

            expect(response.status).to.equal(200);
        });

        it('应该支持 DELETE 请求', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/delete',
                method: 'DELETE'
            }).reply(200, {
                url: 'https://httpbin.org/delete'
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'DELETE',
                url: 'https://httpbin.org/delete'
            });

            expect(response.status).to.equal(200);
        });

        it('应该支持 PATCH 请求', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/patch',
                method: 'PATCH',
                body: JSON.stringify({ patch: 'data' })
            }).reply(200, {
                json: { patch: 'data' }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'PATCH',
                url: 'https://httpbin.org/patch',
                body: { patch: 'data' }
            });

            expect(response.status).to.equal(200);
        });
    });

    describe('响应类型处理', () => {
        it('应该正确处理 JSON 响应', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/json',
                method: 'GET'
            }).reply(200, {
                slideshow: {
                    author: 'Yours Truly',
                    title: 'Sample Slide Show'
                }
            }, {
                headers: { 'content-type': 'application/json' }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.org/json',
                responseType: 'json'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.be.an('object');
        });

        it('应该正确处理文本响应', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/html',
                method: 'GET'
            }).reply(200, '<!DOCTYPE html><html><body><h1>Test HTML</h1></body></html>', {
                headers: { 'content-type': 'text/html' }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.org/html',
                responseType: 'text'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.be.a('string');
            expect(response.data).to.include('html');
        });

        it('应该正确处理非 JSON 文本为文本', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/html',
                method: 'GET'
            }).reply(200, '<!DOCTYPE html><html><body><h1>Test</h1></body></html>', {
                headers: { 'content-type': 'text/html' }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.org/html'
            });

            expect(response.status).to.equal(200);
            // 默认应该尝试解析为 JSON，失败后返回文本
            expect(response.data).to.exist;
        });
    });

    describe('HTTP 状态码处理', () => {
        it('应该正确处理 200 OK', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/status/200',
                method: 'GET'
            }).reply(200);

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.org/status/200'
            });

            expect(response.status).to.equal(200);
            expect(response.statusText).to.equal('OK');
        });

        it('应该正确处理 404 Not Found', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/status/404',
                method: 'GET'
            }).reply(404);

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.org/status/404'
            });

            expect(response.status).to.equal(404);
        });

        it('应该正确处理 500 Internal Server Error', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            mockPool.intercept({
                path: '/status/500',
                method: 'GET'
            }).reply(500);

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.org/status/500'
            });

            expect(response.status).to.equal(500);
        });
    });

    describe('超时处理', () => {
        it('应该在超时时抛出错误', async () => {
            const mockPool = mockAgent.get('https://httpbin.org');
            // 使用 replyWithError 模拟超时错误
            const timeoutError = new Error('Request timeout');
            (timeoutError as any).code = 'UND_ERR_HEADERS_TIMEOUT';
            
            mockPool.intercept({
                path: '/delay/10',
                method: 'GET'
            }).replyWithError(timeoutError);

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.org/delay/10',
                    timeout: 1000 // 1秒超时
                });
                expect.fail('应该抛出超时错误');
            } catch (error: any) {
                expect(error).to.be.instanceOf(HttpError);
                expect(error.message).to.match(/timeout|Timeout/i);
            }
        });
    });

    describe('错误处理', () => {
        it('应该正确处理网络错误', async () => {
            const mockPool = mockAgent.get('http://this-domain-absolutely-does-not-exist-12345.com');
            mockPool.intercept({
                path: '/',
                method: 'GET'
            }).replyWithError(new Error('getaddrinfo ENOTFOUND'));

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
            }
        });
    });

    // 保留其他测试（配置更新、日志等）
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
});
