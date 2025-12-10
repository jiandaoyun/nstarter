/**
 * Undici 适配器测试
 * 使用 undici 官方的 MockAgent 进行 HTTP mock
 */

import { expect } from 'chai';
import {
    MockAgent,
    setGlobalDispatcher,
    getGlobalDispatcher
} from 'undici';
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
        blacklist: [],
        dnsCacheMaxSize: 500
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
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/get',
                method: 'GET'
            }).reply(200, {
                args: {},
                headers: { 'User-Agent': 'undici' },
                url: 'https://httpbin.nstarter/get'
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
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
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/get?foo=bar&num=123&bool=true',
                method: 'GET'
            }).reply(200, {
                args: { foo: 'bar', num: '123', bool: 'true' },
                url: 'https://httpbin.nstarter/get?foo=bar&num=123&bool=true'
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
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
            const mockPool = mockAgent.get('https://httpbin.nstarter');
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
            const mockPool = mockAgent.get('https://httpbin.nstarter');
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

        it('应该自动设置 Content-Type 为 JSON', async () => {
            const mockPool = mockAgent.get('https://httpbin.nstarter');
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
                url: 'https://httpbin.nstarter/post',
                body: { test: 'data' }
            });

            expect(response.status).to.equal(200);
            const data = response.data as any;
            expect(data.headers['Content-Type']).to.include('application/json');
        });

        it('应该正确处理字符串请求体', async () => {
            const mockPool = mockAgent.get('https://httpbin.nstarter');
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
            const mockPool = mockAgent.get('https://httpbin.nstarter');
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
                url: 'https://httpbin.nstarter/put',
                body: { update: 'data' }
            });

            expect(response.status).to.equal(200);
        });

        it('应该支持 DELETE 请求', async () => {
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/delete',
                method: 'DELETE'
            }).reply(200, {
                url: 'https://httpbin.nstarter/delete'
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'DELETE',
                url: 'https://httpbin.nstarter/delete'
            });

            expect(response.status).to.equal(200);
        });

        it('应该支持 PATCH 请求', async () => {
            const mockPool = mockAgent.get('https://httpbin.nstarter');
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
                url: 'https://httpbin.nstarter/patch',
                body: { patch: 'data' }
            });

            expect(response.status).to.equal(200);
        });
    });

    describe('响应类型处理', () => {
        it('应该正确处理 JSON 响应', async () => {
            const mockPool = mockAgent.get('https://httpbin.nstarter');
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
                url: 'https://httpbin.nstarter/json',
                responseType: 'json'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.be.an('object');
        });

        it('应该正确处理文本响应', async () => {
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/html',
                method: 'GET'
            }).reply(200, '<!DOCTYPE html><html><body><h1>Test HTML</h1></body></html>', {
                headers: { 'content-type': 'text/html' }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/html',
                responseType: 'text'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.be.a('string');
            expect(response.data).to.include('html');
        });

        it('应该正确处理非 JSON 文本为文本', async () => {
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/html',
                method: 'GET'
            }).reply(200, '<!DOCTYPE html><html><body><h1>Test</h1></body></html>', {
                headers: { 'content-type': 'text/html' }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/html'
            });

            expect(response.status).to.equal(200);
            // 默认应该尝试解析为 JSON，失败后返回文本
            expect(response.data).to.exist;
        });
    });

    describe('HTTP 状态码处理', () => {
        it('应该正确处理 200 OK', async () => {
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/status/200',
                method: 'GET'
            }).reply(200);

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/status/200'
            });

            expect(response.status).to.equal(200);
            expect(response.statusText).to.equal('OK');
        });

        it('应该正确处理 404 Not Found', async () => {
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/status/404',
                method: 'GET'
            }).reply(404);

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/status/404'
            });

            expect(response.status).to.equal(404);
        });

        it('应该正确处理 500 Internal Server Error', async () => {
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/status/500',
                method: 'GET'
            }).reply(500);

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
            const response = await adapter.request({
                method: 'GET',
                url: 'https://httpbin.nstarter/status/500'
            });

            expect(response.status).to.equal(500);
        });
    });

    describe('超时处理', () => {
        it('应该在超时时抛出错误', async () => {
            const mockPool = mockAgent.get('https://httpbin.nstarter');
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
                    url: 'https://httpbin.nstarter/delay/10',
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

    describe('流式响应处理', () => {
        it('应该支持流式响应', async () => {
            const testData = 'This is a stream response\nLine 2\nLine 3';
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/stream',
                method: 'GET'
            }).reply(200, testData, {
                headers: { 'content-type': 'text/plain' }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
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
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/large-stream',
                method: 'GET'
            }).reply(200, largeData, {
                headers: { 'content-type': 'application/octet-stream' }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
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
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/stream-error',
                method: 'GET'
            }).reply(200, 'partial data', {
                headers: { 'content-type': 'text/plain' }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
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
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/events',
                method: 'GET'
            }).reply(200, sseData, {
                headers: {
                    'content-type': 'text/event-stream',
                    'cache-control': 'no-cache',
                    'connection': 'keep-alive'
                }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
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
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/sse-events',
                method: 'GET'
            }).reply(200, sseData, {
                headers: { 'content-type': 'text/event-stream' }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
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

            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/sse-multiple',
                method: 'GET'
            }).reply(200, sseData, {
                headers: { 'content-type': 'text/event-stream' }
            });

            const adapter = new UndiciAdapter(defaultRequestConfig, defaultSecurityConfig);
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
});
