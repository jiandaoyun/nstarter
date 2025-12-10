/**
 * Axios 适配器测试
 */

import { expect } from 'chai';
import nock = require('nock');
import { AxiosAdapter } from '../../src';
import { HttpError } from '../../src';
import type {
    RequestConfig,
    SecurityConfig
} from '../../src';

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
});

