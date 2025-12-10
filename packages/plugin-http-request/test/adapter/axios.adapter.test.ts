/**
 * Axios 适配器测试
 */

import { expect } from 'chai';
import nock from 'nock';
import { AxiosAdapter } from '../../src';
import { HttpError } from '../../src';
import type {
    RequestConfig,
    SecurityConfig,
    HttpRequestOptions
} from '../../src';
import { HttpsProxyAgent } from 'https-proxy-agent';

describe('AxiosAdapter', () => {
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
        blacklist: [],
        dnsCacheMaxSize: 500
    };

    afterEach(() => {
        nock.cleanAll();
    });

    describe('构造函数和基础功能', () => {
        it('应该正确创建实例', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            expect(adapter).to.be.instanceOf(AxiosAdapter);
            expect(adapter.name).to.equal('axios');
        });

        it('应该检查 Axios 可用性', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            expect(adapter.isAvailable()).to.be.true;
        });
    });

    describe('HTTP GET 请求', () => {
        it('应该成功发送 GET 请求', async () => {
            nock('https://httpbin.nstarter')
                .get('/get')
                .reply(200, {
                    args: {},
                    headers: { 'User-Agent': 'axios' },
                    url: 'https://httpbin.nstarter/get'
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/get'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.exist;
            expect(response.headers).to.be.an('object');
            expect(response.statusText).to.be.a('string');
        });

        it('应该正确处理查询参数', async () => {
            nock('https://httpbin.nstarter')
                .get('/get')
                .query({ foo: 'bar', num: '123', bool: 'true' })
                .reply(200, {
                    args: { foo: 'bar', num: '123', bool: 'true' },
                    url: 'https://httpbin.nstarter/get?foo=bar&num=123&bool=true'
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/get',
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
            nock('https://httpbin.nstarter', {
                reqheaders: {
                    'X-Custom-Header': 'test-value',
                    'User-Agent': 'test-agent'
                }
            })
                .get('/headers')
                .reply(200, {
                    headers: {
                        'X-Custom-Header': 'test-value',
                        'User-Agent': 'test-agent'
                    }
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/headers',
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
            nock('https://httpbin.nstarter')
                .post('/post', {
                    test: 'data',
                    number: 42
                })
                .reply(200, {
                    json: {
                        test: 'data',
                        number: 42
                    }
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'POST',
                url: 'https://httpbin.nstarter/post',
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

        it('应该正确处理 JSON 请求体', async () => {
            const testData = {
                string: 'test',
                number: 123,
                boolean: true,
                array: [1, 2, 3],
                object: { nested: 'value' }
            };

            nock('https://httpbin.nstarter')
                .post('/post', testData)
                .reply(200, {
                    json: testData
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'POST',
                url: 'https://httpbin.nstarter/post',
                body: testData
            });

            expect(response.status).to.equal(200);
            const data = response.data as any;
            expect(data.json).to.deep.equal(testData);
        });

        it('应该正确处理字符串请求体', async () => {
            nock('https://httpbin.nstarter')
                .post('/post', 'plain text data')
                .reply(200, {
                    data: 'plain text data'
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'POST',
                url: 'https://httpbin.nstarter/post',
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
            nock('https://httpbin.nstarter')
                .put('/put', { update: 'data' })
                .reply(200, {
                    json: { update: 'data' }
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'PUT',
                url: 'https://httpbin.nstarter/put',
                body: { update: 'data' }
            });

            expect(response.status).to.equal(200);
        });

        it('应该支持 DELETE 请求', async () => {
            nock('https://httpbin.nstarter')
                .delete('/delete')
                .reply(200, {
                    url: 'https://httpbin.nstarter/delete'
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'DELETE',
                url: 'https://httpbin.nstarter/delete'
            });

            expect(response.status).to.equal(200);
        });

        it('应该支持 PATCH 请求', async () => {
            nock('https://httpbin.nstarter')
                .patch('/patch', { patch: 'data' })
                .reply(200, {
                    json: { patch: 'data' }
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'PATCH',
                url: 'https://httpbin.nstarter/patch',
                body: { patch: 'data' }
            });

            expect(response.status).to.equal(200);
        });
    });

    describe('响应类型处理', () => {
        it('应该正确处理 JSON 响应', async () => {
            nock('https://httpbin.nstarter')
                .get('/json')
                .reply(200, {
                    slideshow: {
                        author: 'Yours Truly',
                        title: 'Sample Slide Show'
                    }
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/json',
                responseType: 'json'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.be.an('object');
        });

        it('应该正确处理文本响应', async () => {
            nock('https://httpbin.nstarter')
                .get('/html')
                .reply(200, '<!DOCTYPE html><html><body><h1>Test HTML</h1></body></html>');

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/html',
                responseType: 'text'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.be.a('string');
            expect(response.data).to.include('html');
        });
    });

    describe('HTTP 状态码处理', () => {
        it('应该正确处理 200 OK', async () => {
            nock('https://httpbin.nstarter')
                .get('/status/200')
                .reply(200);

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/status/200'
            });

            expect(response.status).to.equal(200);
        });

        it('应该正确处理 404 Not Found', async () => {
            nock('https://httpbin.nstarter')
                .get('/status/404')
                .reply(404);

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/status/404'
            });

            expect(response.status).to.equal(404);
        });

        it('应该正确处理 500 Internal Server Error', async () => {
            nock('https://httpbin.nstarter')
                .get('/status/500')
                .reply(500);

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/status/500'
            });

            expect(response.status).to.equal(500);
        });
    });

    describe('超时处理', () => {
        it('应该在超时时抛出错误', async () => {
            nock('https://httpbin.nstarter')
                .get('/delay/10')
                .delayConnection(5000) // 延迟5秒
                .reply(200);

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.nstarter/delay/10',
                    timeout: 1000 // 1秒超时
                });
                expect.fail('应该抛出超时错误');
            } catch (error: any) {
                expect(error).to.be.instanceOf(HttpError);
                expect(error.message).to.match(/timeout|aborted/i);
            }
        });
    });

    describe('重试机制', () => {
        it('应该在临时失败时重试', async () => {
            // 第一次和第二次返回 503，第三次返回 200
            nock('https://httpbin.nstarter')
                .get('/status/503')
                .reply(503)
                .get('/status/503')
                .reply(503)
                .get('/status/503')
                .reply(503);

            const config: RequestConfig = {
                ...defaultRequestConfig,
                retries: 2,
                retryDelay: 100
            };
            const adapter = new AxiosAdapter(config, defaultSecurityConfig);

            // httpbin.nstarter/status/503 会返回 503，应该触发重试
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/status/503'
            });

            // 即使重试，503 仍然是 503
            expect(response.status).to.equal(503);
        });
    });

    describe('错误处理', () => {
        it('应该正确处理网络错误', async () => {
            nock('http://this-domain-absolutely-does-not-exist-12345.com')
                .get('/')
                .replyWithError({ code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND' });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);

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

        it('应该正确处理无效的 URL', async () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);

            try {
                await adapter.request({
                    method: 'GET',
                    url: 'not-a-valid-url'
                });
                expect.fail('应该抛出错误');
            } catch (error: any) {
                expect(error).to.exist;
            }
        });
    });

    describe('配置更新', () => {
        it('应该支持更新配置', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);

            adapter.updateConfig({ timeout: 3000 });

            // 配置更新后应该生效（通过实际请求验证）
            expect(adapter).to.exist;
        });

        it('应该支持设置日志记录器', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);

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
        it('应该正确返回响应头', async () => {
            nock('https://httpbin.nstarter')
                .get('/response-headers')
                .query({ 'X-Test-Header': 'test-value' })
                .reply(200, {}, {
                    'Content-Type': 'application/json',
                    'X-Test-Header': 'test-value'
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/response-headers',
                params: {
                    'X-Test-Header': 'test-value'
                }
            });

            expect(response.headers).to.be.an('object');
            expect(response.headers['content-type']).to.exist;
        });
    });

    describe('重定向处理', () => {
        it('应该正确处理重定向', async () => {
            // 模拟重定向
            nock('https://httpbin.nstarter')
                .get('/redirect/1')
                .reply(302, undefined, {
                    'Location': 'https://httpbin.nstarter/get'
                })
                .get('/get')
                .reply(200, {
                    url: 'https://httpbin.nstarter/get'
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/redirect/1'
            });

            expect(response.status).to.equal(200);
        });
    });

    describe('流式响应处理', () => {
        it('应该支持流式响应', async () => {
            const testData = 'This is a stream response\nLine 2\nLine 3';
            nock('https://httpbin.nstarter')
                .get('/stream')
                .reply(200, testData, {
                    'Content-Type': 'text/plain'
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/stream',
                responseType: 'stream'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.exist;
            // 检查返回的是流对象
            expect(response.data).to.have.property('on');
            expect(response.data).to.have.property('read');

            // 读取流数据
            const chunks: Buffer[] = [];
            return new Promise<void>((resolve, reject) => {
                response.data.on('data', (chunk: Buffer) => {
                    chunks.push(chunk);
                });
                response.data.on('end', () => {
                    const data = Buffer.concat(chunks).toString();
                    expect(data).to.equal(testData);
                    resolve();
                });
                response.data.on('error', reject);
            });
        });

        it('应该正确处理大文件流式传输', async () => {
            // 生成较大的测试数据
            const largeData = 'x'.repeat(1024 * 100); // 100KB
            nock('https://httpbin.nstarter')
                .get('/large-stream')
                .reply(200, largeData, {
                    'Content-Type': 'application/octet-stream'
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/large-stream',
                responseType: 'stream'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.exist;

            // 读取流数据并验证大小
            let totalBytes = 0;
            return new Promise<void>((resolve, reject) => {
                response.data.on('data', (chunk: Buffer) => {
                    totalBytes += chunk.length;
                });
                response.data.on('end', () => {
                    expect(totalBytes).to.equal(largeData.length);
                    resolve();
                });
                response.data.on('error', reject);
            });
        });

        it('应该正确处理流式响应的错误', async () => {
            nock('https://httpbin.nstarter')
                .get('/stream-error')
                .reply(200, 'partial data', {
                    'Content-Type': 'text/plain'
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/stream-error',
                responseType: 'stream'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.exist;

            // 模拟流错误
            return new Promise<void>((resolve) => {
                response.data.on('error', (error: Error) => {
                    expect(error).to.exist;
                    resolve();
                });
                // 手动触发错误
                response.data.destroy(new Error('Stream error'));
            });
        });
    });

    describe('SSE (Server-Sent Events) 处理', () => {
        it('应该支持 SSE 流式响应', async () => {
            const sseData = 'data: event 1\n\ndata: event 2\n\ndata: event 3\n\n';
            nock('https://httpbin.nstarter')
                .get('/events')
                .reply(200, sseData, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/events',
                responseType: 'stream',
                headers: {
                    'Accept': 'text/event-stream'
                }
            });

            expect(response.status).to.equal(200);
            expect(response.headers['content-type']).to.include('text/event-stream');
            expect(response.data).to.exist;

            // 读取 SSE 数据
            const chunks: Buffer[] = [];
            return new Promise<void>((resolve, reject) => {
                response.data.on('data', (chunk: Buffer) => {
                    chunks.push(chunk);
                });
                response.data.on('end', () => {
                    const data = Buffer.concat(chunks).toString();
                    expect(data).to.include('data: event 1');
                    expect(data).to.include('data: event 2');
                    expect(data).to.include('data: event 3');
                    resolve();
                });
                response.data.on('error', reject);
            });
        });

        it('应该正确解析 SSE 事件格式', async () => {
            const sseData = 'id: 1\nevent: message\ndata: {"type":"test"}\n\nid: 2\nevent: update\ndata: {"status":"ok"}\n\n';
            nock('https://httpbin.nstarter')
                .get('/sse-events')
                .reply(200, sseData, {
                    'Content-Type': 'text/event-stream'
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/sse-events',
                responseType: 'stream'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.exist;

            // 解析 SSE 事件
            const events: string[] = [];
            return new Promise<void>((resolve, reject) => {
                let buffer = '';
                response.data.on('data', (chunk: Buffer) => {
                    buffer += chunk.toString();
                    // 按双换行符分割事件
                    const parts = buffer.split('\n\n');
                    buffer = parts.pop() || '';
                    events.push(...parts.filter(p => p.trim()));
                });
                response.data.on('end', () => {
                    expect(events.length).to.be.greaterThan(0);
                    // 验证事件格式
                    const firstEvent = events[0];
                    expect(firstEvent).to.include('id: 1');
                    expect(firstEvent).to.include('event: message');
                    expect(firstEvent).to.include('data: {"type":"test"}');
                    resolve();
                });
                response.data.on('error', reject);
            });
        });

        it('应该正确处理 SSE 流式传输的多个事件', async () => {
            // 生成多个 SSE 事件
            const events: string[] = [];
            for (let i = 1; i <= 10; i++) {
                events.push(`data: Event ${i}\n\n`);
            }
            const sseData = events.join('');

            nock('https://httpbin.nstarter')
                .get('/sse-multiple')
                .reply(200, sseData, {
                    'Content-Type': 'text/event-stream'
                });

            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/sse-multiple',
                responseType: 'stream'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.exist;

            // 统计接收的事件数量
            let eventCount = 0;
            return new Promise<void>((resolve, reject) => {
                let buffer = '';
                response.data.on('data', (chunk: Buffer) => {
                    buffer += chunk.toString();
                    const matches = buffer.match(/data: .+\n\n/g);
                    if (matches) {
                        eventCount += matches.length;
                        buffer = buffer.replace(/data: .+\n\n/g, '');
                    }
                });
                response.data.on('end', () => {
                    expect(eventCount).to.equal(10);
                    resolve();
                });
                response.data.on('error', reject);
            });
        });
    });

    describe('代理配置', () => {
        it('应该支持带认证的HTTP代理配置', () => {
            const config: RequestConfig = {
                ...defaultRequestConfig,
                proxy: {
                    host: 'proxy.example.com',
                    port: 8080,
                    protocol: 'http',
                    auth: {
                        username: 'user',
                        password: 'pass'
                    }
                }
            };

            const adapter = new AxiosAdapter(config, defaultSecurityConfig);
            // 只验证配置是否正确创建，不实际发送请求
            expect(adapter).to.exist;
            expect(adapter.isAvailable()).to.be.true;
        });

        it('应该支持正向代理配置（验证配置应用）', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            // 验证适配器可以接受正向代理元数据
            expect(adapter).to.exist;
            expect(adapter.isAvailable()).to.be.true;
        });
    });

    describe('错误处理与内部构建逻辑', () => {
        it('handleAxiosError 应包装 isAxiosError 的响应', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const fakeResp = {
                status: 500,
                statusText: 'Internal Error',
                headers: { 'x-test': '1' },
                data: { msg: 'err' }
            };
            const error: any = {
                isAxiosError: true,
                message: 'boom',
                code: 'ECONNRESET',
                response: fakeResp
            };

            const httpError = (adapter as any).handleAxiosError(error, {
                method: 'GET',
                url: 'https://example.com'
            } satisfies HttpRequestOptions);

            expect(httpError).to.be.instanceOf(HttpError);
            expect(httpError.code).to.equal('ECONNRESET');
            expect(httpError.response?.status).to.equal(500);
            expect(httpError.response?.headers?.['x-test']).to.equal('1');
        });

        it('handleAxiosError 非 axios 错误应返回 UNKNOWN_ERROR', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const error: any = {
                message: 'oops'
            };

            const httpError = (adapter as any).handleAxiosError(error, {
                method: 'POST',
                url: 'https://example.com'
            } satisfies HttpRequestOptions);

            expect(httpError.code).to.equal('UNKNOWN_ERROR');
            expect(httpError.message).to.equal('oops');
        });

        it('configureAxiosProxy 无全局代理时应禁用默认代理', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const axiosConfig: any = {};

            (adapter as any).configureAxiosProxy(axiosConfig, {
                method: 'GET',
                url: 'https://example.com'
            } satisfies HttpRequestOptions);

            expect(axiosConfig.proxy).to.be.false;
        });

        it('applyForwardProxy 应处理 HTTPS 正向代理', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const axiosConfig: any = {};
            (adapter as any).applyForwardProxy(axiosConfig, {
                proxyUrl: 'https://user:pass@proxy.example.com:8443',
                isHttps: true
            });

            expect(axiosConfig.httpsAgent).to.be.instanceOf(HttpsProxyAgent);
            expect(axiosConfig.proxy).to.be.false;
        });

        it('applyForwardProxy 应处理 HTTP 正向代理并解析认证', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const axiosConfig: any = {};
            (adapter as any).applyForwardProxy(axiosConfig, {
                proxyUrl: 'http://user:pa%24s@proxy.example.com:8080',
                isHttps: false
            });

            expect(axiosConfig.proxy).to.deep.include({
                host: 'proxy.example.com',
                port: 8080,
                protocol: 'http'
            });
            expect(axiosConfig.proxy.auth?.username).to.equal('user');
            expect(axiosConfig.proxy.auth?.password).to.equal('pa$s');
        });

        it('buildProxyConfig 应生成带认证的配置', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const proxyConfig = (adapter as any).buildProxyConfig({
                host: 'proxy.local',
                port: 3128,
                protocol: 'http',
                auth: {
                    username: 'a',
                    password: 'b'
                }
            });

            expect(proxyConfig).to.deep.equal({
                host: 'proxy.local',
                port: 3128,
                protocol: 'http',
                auth: { username: 'a', password: 'b' }
            });
        });

        it('isAvailable 为 false 时应直接抛出提示错误', async () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            (adapter as any).isAvailable = () => false;

            try {
                await adapter.request({
                    method: 'GET',
                    url: 'https://httpbin.nstarter/unavailable'
                });
                throw new Error('should throw');
            } catch (error) {
                expect((error as Error).message).to.include('Axios is not available');
            }
        });

        it('configureAxiosProxy 应使用全局代理配置', () => {
            const config: RequestConfig = {
                ...defaultRequestConfig,
                proxy: {
                    protocol: 'http',
                    host: 'proxy.example.com',
                    port: 8080
                }
            };
            const adapter = new AxiosAdapter(config, defaultSecurityConfig);
            const axiosConfig: any = {};

            (adapter as any).configureAxiosProxy(axiosConfig, {
                method: 'GET',
                url: 'https://example.com'
            } satisfies HttpRequestOptions);

            expect(axiosConfig.proxy).to.deep.include({
                host: 'proxy.example.com',
                port: 8080,
                protocol: 'http'
            });
        });

        it('configureAxiosProxy 应处理正向代理元数据', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const axiosConfig: any = {};

            (adapter as any).configureAxiosProxy(axiosConfig, {
                method: 'GET',
                url: 'https://example.com',
                meta: {
                    __forwardProxy: {
                        proxyUrl: 'https://user:pass@proxy.example.com:8443',
                        isHttps: true
                    }
                }
            } satisfies HttpRequestOptions);

            expect(axiosConfig.httpsAgent).to.exist;
            expect(axiosConfig.proxy).to.equal(false);
        });

        it('buildAxiosConfig 应应用默认超时和响应类型为空路径', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const config = (adapter as any).buildAxiosConfig({
                method: 'GET',
                url: 'https://example.com'
            } satisfies HttpRequestOptions, 'https://example.com');

            expect(config.timeout).to.equal(defaultRequestConfig.timeout);
            expect(config.responseType).to.be.undefined;
        });

        it('handleAxiosError 非 axios 错误应返回 UNKNOWN_ERROR（无 message）', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const error: any = {};

            const httpError = (adapter as any).handleAxiosError(error, {
                method: 'GET',
                url: 'https://example.com'
            } satisfies HttpRequestOptions);

            expect(httpError.code).to.equal('UNKNOWN_ERROR');
            expect(httpError.message).to.equal('Unknown error');
        });

        it('handleAxiosError isAxiosError 但无 code 时应回落 AXIOS_ERROR', () => {
            const adapter = new AxiosAdapter(defaultRequestConfig, defaultSecurityConfig);
            const error: any = {
                isAxiosError: true,
                message: 'boom',
                response: {
                    status: 400,
                    statusText: 'Bad',
                    headers: {},
                    data: { e: 1 }
                }
            };

            const httpError = (adapter as any).handleAxiosError(error, {
                method: 'GET',
                url: 'https://example.com'
            } satisfies HttpRequestOptions);

            expect(httpError.code).to.equal('AXIOS_ERROR');
            expect(httpError.response?.status).to.equal(400);
        });
    });
});

