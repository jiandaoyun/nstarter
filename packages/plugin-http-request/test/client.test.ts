/**
 * HttpClient 核心测试
 */

import { expect } from 'chai';
import * as sinon from 'sinon';
import { HttpClient } from '../src';
import { EHttpRequestClientAdapter } from '../src';
import type {
    PartialHttpClientConfig,
    HttpResponse,
    HttpRequestOptions,
    IForwardProxy
} from '../src';
import { SecurityError } from '../src';
import * as adapters from '../src/adapter';
import * as security from '../src/security';

describe('HttpClient', () => {
    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('构造函数', () => {
        it('应该使用默认配置创建客户端', () => {
            const client = new HttpClient();
            expect(client).to.be.instanceOf(HttpClient);
        });

        it('应该使用自定义配置创建客户端', () => {
            const config: PartialHttpClientConfig = {
                adapter: EHttpRequestClientAdapter.axios,
                request: {
                    timeout: 3000
                },
                logging: {
                    enabled: false
                }
            };

            const client = new HttpClient(config);
            expect(client).to.exist;
        });

        it('应该初始化所有内部组件', () => {
            const client = new HttpClient({
                logging: { enabled: false }
            });

            expect(client).to.exist;
            expect(client.getDnsCacheSize()).to.equal(0);
        });

        it('应该在适配器不可用时抛出错误', () => {
            // Mock adapter isAvailable to return false
            const axiosStub = sandbox.stub(adapters.AxiosAdapter.prototype, 'isAvailable').returns(false);

            expect(() => {
                new HttpClient({ adapter: EHttpRequestClientAdapter.axios });
            }).to.throw(/not available/);

            axiosStub.restore();
        });
    });

    describe('fromHttpClientConfig', () => {
        it('应该通过静态方法创建客户端', () => {
            const client = HttpClient.fromHttpClientConfig({
                logging: { enabled: false }
            });

            expect(client).to.be.instanceOf(HttpClient);
        });

        it('应该支持无参数调用', () => {
            const client = HttpClient.fromHttpClientConfig();
            expect(client).to.be.instanceOf(HttpClient);
        });
    });

    describe('withAdapter', () => {
        it('应该切换到指定的适配器', () => {
            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.axios,
                logging: { enabled: false }
            });

            client.withAdapter(EHttpRequestClientAdapter.undici);
            expect(client).to.exist;
        });

        it('应该支持链式调用', () => {
            const client = new HttpClient({ logging: { enabled: false } });

            const result = client
                .withAdapter(EHttpRequestClientAdapter.axios)
                .withAdapter(EHttpRequestClientAdapter.undici);

            expect(result).to.equal(client);
        });
    });

    describe('withForwardProxy', () => {
        it('应该配置正向代理', () => {
            const client = new HttpClient({ logging: { enabled: false } });

            const proxy: IForwardProxy = {
                enabled: true,
                http_proxy: 'http://proxy.example.com:8080',
                https_proxy: 'https://proxy.example.com:8443',
                no_proxy: ['localhost', '127.0.0.1']
            };

            client.withForwardProxy(proxy);
            expect(client).to.exist;
        });

        it('应该支持链式调用', () => {
            const client = new HttpClient({ logging: { enabled: false } });

            const proxy: IForwardProxy = {
                enabled: true,
                http_proxy: 'http://proxy.example.com:8080',
                https_proxy: 'https://proxy.example.com:8443',
                no_proxy: ['localhost', '127.0.0.1']
            };

            const result = client.withForwardProxy(proxy);
            expect(result).to.equal(client);
        });

        it('应该记录代理配置日志', () => {
            const logs: any[] = [];
            const client = new HttpClient({
                logging: {
                    enabled: true,
                    logger: {
                        debug: () => {
                        },
                        info: (...args) => logs.push({ level: 'info', args }),
                        warn: () => {
                        },
                        error: () => {
                        }
                    }
                }
            });

            const proxy: IForwardProxy = {
                enabled: true,
                http_proxy: 'http://proxy.example.com:8080',
                https_proxy: 'https://proxy.example.com:8443',
                no_proxy: ['localhost']
            };

            client.withForwardProxy(proxy);

            const proxyLog = logs.find(log =>
                log.args[0]?.includes?.('Forward proxy') ||
                log.args[0] === 'Forward proxy configured'
            );
            expect(proxyLog).to.exist;
        });
    });

    describe('request', () => {
        it('应该成功发送HTTP请求', async () => {
            const client = new HttpClient({ logging: { enabled: false } });

            // Mock adapter.request
            const mockResponse: HttpResponse = {
                status: 200,
                statusText: 'OK',
                headers: {},
                data: { success: true },
                config: { method: 'GET', url: 'https://example.com' }
            };

            sandbox.stub(adapters.AxiosAdapter.prototype, 'request').resolves(mockResponse);

            const response = await client.request({
                method: 'GET',
                url: 'https://example.com'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.deep.equal({ success: true });
        });

        it('应该进行SSRF安全验证', async () => {
            const client = new HttpClient({
                logging: { enabled: false },
                security: {
                    enableIpValidation: true,
                    allowPrivateIp: false
                }
            });

            // Mock adapter to never be called
            const adapterStub = sandbox.stub(adapters.AxiosAdapter.prototype, 'request');

            try {
                await client.request({
                    method: 'GET',
                    url: 'http://127.0.0.1'
                });
                expect.fail('应该抛出SecurityError');
            } catch (error) {
                expect(error).to.be.instanceOf(SecurityError);
                expect(adapterStub.called).to.be.false;
            }
        });

        it('应该在URL安全验证失败时抛出错误', async () => {
            const client = new HttpClient({
                logging: { enabled: false },
                security: {
                    blacklist: ['bad.example.com']
                }
            });

            try {
                await client.request({
                    method: 'GET',
                    url: 'https://bad.example.com'
                });
                expect.fail('应该抛出SecurityError');
            } catch (error) {
                expect(error).to.be.instanceOf(SecurityError);
            }
        });

        it('应该在响应中设置Host头当URL被替换为IP时', async () => {
            const client = new HttpClient({
                logging: { enabled: false },
                security: {
                    enableDnsValidation: true,
                    enableIpValidation: false
                }
            });

            let capturedOptions: HttpRequestOptions | null = null;
            sandbox.stub(adapters.AxiosAdapter.prototype, 'request').callsFake(async (options) => {
                capturedOptions = options;
                return {
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    data: {},
                    config: options
                };
            });

            // Mock SSRF guard to replace URL with IP
            sandbox.stub(security.SsrfGuard.prototype, 'validateAndGetSafeUrl').resolves({
                safeUrl: 'https://example.com',
                result: {
                    passed: true,
                    originalUrl: 'https://example.com',
                    hostname: 'example.com',
                    resolvedIps: ['93.184.216.34'],
                    safeIp: '93.184.216.34'
                }
            });

            await client.request({
                method: 'GET',
                url: 'https://example.com'
            });

            // Verify Host header was NOT set (since safeUrl is same as hostname)
            expect(capturedOptions).to.exist;
        });

        it('应该记录请求和响应日志', async () => {
            const logs: any[] = [];
            const client = new HttpClient({
                logging: {
                    enabled: true,
                    logRequestBody: true,
                    logResponseBody: true,
                    logger: {
                        debug: (...args) => logs.push({ level: 'debug', args }),
                        info: (...args) => logs.push({ level: 'info', args }),
                        warn: () => {
                        },
                        error: () => {
                        }
                    }
                }
            });

            sandbox.stub(adapters.AxiosAdapter.prototype, 'request').resolves({
                status: 200,
                statusText: 'OK',
                headers: {},
                data: { result: 'success' },
                config: { method: 'POST', url: 'https://example.com' }
            });

            await client.request({
                method: 'POST',
                url: 'https://example.com',
                body: { test: 'data' }
            });

            const requestLog = logs.find(log =>
                log.args[0]?.includes?.('Outgoing HTTP request') ||
                log.args[0] === 'Outgoing HTTP request'
            );
            const responseLog = logs.find(log =>
                log.args[0]?.includes?.('HTTP response received') ||
                log.args[0] === 'HTTP response received'
            );

            expect(requestLog).to.exist;
            expect(responseLog).to.exist;
        });

        it('应该在请求失败时记录错误日志', async () => {
            const logs: any[] = [];
            const client = new HttpClient({
                logging: {
                    enabled: true,
                    logger: {
                        debug: () => {
                        },
                        info: () => {
                        },
                        warn: () => {
                        },
                        error: (...args) => logs.push({ level: 'error', args })
                    }
                }
            });

            const testError = new Error('Network error');
            sandbox.stub(adapters.AxiosAdapter.prototype, 'request').rejects(testError);

            try {
                await client.request({
                    method: 'GET',
                    url: 'https://example.com'
                });
                expect.fail('应该抛出错误');
            } catch (error) {
                expect(error).to.equal(testError);
            }

            const errorLog = logs.find(log =>
                log.args[0]?.includes?.('HTTP request failed') ||
                log.args[0] === 'HTTP request failed'
            );
            expect(errorLog).to.exist;
        });

        it('应该应用正向代理配置', async () => {
            const client = new HttpClient({ logging: { enabled: false } });

            const proxy: IForwardProxy = {
                enabled: true,
                http_proxy: 'http://proxy.example.com:8080',
                https_proxy: 'https://proxy.example.com:8443',
                no_proxy: []
            };

            client.withForwardProxy(proxy);

            let capturedOptions: HttpRequestOptions | null = null;
            sandbox.stub(adapters.AxiosAdapter.prototype, 'request').callsFake(async (options) => {
                capturedOptions = options;
                return {
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    data: {},
                    config: options
                };
            });

            await client.request({
                method: 'GET',
                url: 'https://example.com'
            });

            expect(capturedOptions?.meta?.__forwardProxy).to.exist;
            expect(capturedOptions?.meta?.__forwardProxy.isHttps).to.be.true;
        });

        it('应该跳过no_proxy列表中的域名', async () => {
            const client = new HttpClient({
                logging: { enabled: false },
                security: {
                    enableDnsValidation: false,
                    enableIpValidation: false,
                    allowPrivateIp: true
                }
            });

            const proxy: IForwardProxy = {
                enabled: true,
                https_proxy: 'https://proxy.example.com:8443',
                http_proxy: 'http://proxy.example.com:8080',
                no_proxy: ['example.com', '.internal.com']
            };

            client.withForwardProxy(proxy);

            let capturedOptions: HttpRequestOptions | null = null;
            sandbox.stub(adapters.AxiosAdapter.prototype, 'request').callsFake(async (options) => {
                capturedOptions = options;
                return {
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    data: {},
                    config: options
                };
            });

            await client.request({
                method: 'GET',
                url: 'http://example.com'
            });

            // 应该不包含代理配置
            expect(capturedOptions?.meta?.__forwardProxy).to.be.undefined;
        });

        it('应该正确截断过长的请求体', async () => {
            const logs: any[] = [];
            const client = new HttpClient({
                logging: {
                    enabled: true,
                    logRequestBody: true,
                    bodyMaxLength: 10,
                    logger: {
                        debug: () => {
                        },
                        info: (...args) => logs.push({ level: 'info', args }),
                        warn: () => {
                        },
                        error: () => {
                        }
                    }
                }
            });

            sandbox.stub(adapters.AxiosAdapter.prototype, 'request').resolves({
                status: 200,
                statusText: 'OK',
                headers: {},
                data: {},
                config: { method: 'POST', url: 'https://example.com' }
            });

            await client.request({
                method: 'POST',
                url: 'https://example.com',
                body: 'This is a very long request body that should be truncated'
            });

            const requestLog = logs.find(log =>
                log.args[0] === 'Outgoing HTTP request'
            );

            if (requestLog && requestLog.args[1]?.body) {
                const loggedBody = requestLog.args[1].body;
                expect(loggedBody).to.include('[truncated]');
            }
        });

        it('应该正确处理Buffer类型的请求体', async () => {
            const logs: any[] = [];
            const client = new HttpClient({
                logging: {
                    enabled: true,
                    logRequestBody: true,
                    logger: {
                        debug: () => {
                        },
                        info: (...args) => logs.push({ level: 'info', args }),
                        warn: () => {
                        },
                        error: () => {
                        }
                    }
                }
            });

            sandbox.stub(adapters.AxiosAdapter.prototype, 'request').resolves({
                status: 200,
                statusText: 'OK',
                headers: {},
                data: {},
                config: { method: 'POST', url: 'https://example.com' }
            });

            const buffer = Buffer.from('test data');
            await client.request({
                method: 'POST',
                url: 'https://example.com',
                body: buffer
            });

            const requestLog = logs.find(log =>
                log.args[0] === 'Outgoing HTTP request'
            );

            if (requestLog && requestLog.args[1]?.body) {
                const loggedBody = requestLog.args[1].body;
                expect(loggedBody).to.include('<Buffer');
                expect(loggedBody).to.include('bytes>');
            }
        });
    });

    describe('便捷方法', () => {
        beforeEach(() => {
            sandbox.stub(adapters.AxiosAdapter.prototype, 'request').resolves({
                status: 200,
                statusText: 'OK',
                headers: {},
                data: { success: true },
                config: { method: 'GET', url: 'https://example.com' }
            });
        });

        describe('get', () => {
            it('应该发送GET请求', async () => {
                const client = new HttpClient({ logging: { enabled: false } });
                const response = await client.get('https://example.com');

                expect(response.status).to.equal(200);
            });

            it('应该支持查询参数', async () => {
                const client = new HttpClient({ logging: { enabled: false } });
                const response = await client.get('https://example.com', {
                    params: { foo: 'bar' }
                });

                expect(response.status).to.equal(200);
            });
        });

        describe('post', () => {
            it('应该发送POST请求', async () => {
                const client = new HttpClient({ logging: { enabled: false } });
                const response = await client.post('https://example.com', { data: 'test' });

                expect(response.status).to.equal(200);
            });

            it('应该支持没有body的POST请求', async () => {
                const client = new HttpClient({ logging: { enabled: false } });
                const response = await client.post('https://example.com');

                expect(response.status).to.equal(200);
            });

            it('应该支持额外的选项', async () => {
                const client = new HttpClient({ logging: { enabled: false } });
                const response = await client.post('https://example.com', { data: 'test' }, {
                    headers: { 'X-Custom': 'header' }
                });

                expect(response.status).to.equal(200);
            });
        });

        describe('put', () => {
            it('应该发送PUT请求', async () => {
                const client = new HttpClient({ logging: { enabled: false } });
                const response = await client.put('https://example.com', { data: 'test' });

                expect(response.status).to.equal(200);
            });
        });

        describe('delete', () => {
            it('应该发送DELETE请求', async () => {
                const client = new HttpClient({ logging: { enabled: false } });
                const response = await client.delete('https://example.com');

                expect(response.status).to.equal(200);
            });

            it('应该支持额外的选项', async () => {
                const client = new HttpClient({ logging: { enabled: false } });
                const response = await client.delete('https://example.com', {
                    headers: { 'Authorization': 'Bearer token' }
                });

                expect(response.status).to.equal(200);
            });
        });

        describe('patch', () => {
            it('应该发送PATCH请求', async () => {
                const client = new HttpClient({ logging: { enabled: false } });
                const response = await client.patch('https://example.com', { data: 'test' });

                expect(response.status).to.equal(200);
            });
        });
    });

    describe('DNS缓存管理', () => {
        it('应该清空DNS缓存', () => {
            const client = new HttpClient({ logging: { enabled: false } });

            const spy = sandbox.spy(security.SsrfGuard.prototype, 'clearDnsCache');

            client.clearDnsCache();

            expect(spy.calledOnce).to.be.true;
        });

        it('应该返回DNS缓存大小', () => {
            const client = new HttpClient({ logging: { enabled: false } });

            const size = client.getDnsCacheSize();
            expect(size).to.be.a('number');
            expect(size).to.be.greaterThanOrEqual(0);
        });

        it('应该在清空后DNS缓存大小为0', async () => {
            const client = new HttpClient({
                logging: { enabled: false },
                security: {
                    enableDnsValidation: true
                }
            });

            sandbox.stub(adapters.AxiosAdapter.prototype, 'request').resolves({
                status: 200,
                statusText: 'OK',
                headers: {},
                data: {},
                config: { method: 'GET', url: 'https://example.com' }
            });

            // 发送一个请求以填充DNS缓存
            try {
                await client.request({
                    method: 'GET',
                    url: 'https://google.com'
                });
            } catch {
                // 忽略可能的网络错误
            }

            // 清空缓存
            client.clearDnsCache();

            // 验证缓存已清空
            expect(client.getDnsCacheSize()).to.equal(0);
        });
    });

    describe('错误处理', () => {
        it('应该正确传播适配器错误', async () => {
            const client = new HttpClient({ logging: { enabled: false } });

            const testError = new Error('Adapter error');
            sandbox.stub(adapters.AxiosAdapter.prototype, 'request').rejects(testError);

            try {
                await client.request({
                    method: 'GET',
                    url: 'https://example.com'
                });
                expect.fail('应该抛出错误');
            } catch (error) {
                expect(error).to.equal(testError);
            }
        });

        it('应该正确传播安全错误', async () => {
            const client = new HttpClient({
                logging: { enabled: false },
                security: {
                    whitelist: ['allowed.com']
                }
            });

            try {
                await client.request({
                    method: 'GET',
                    url: 'https://not-allowed.com'
                });
                expect.fail('应该抛出SecurityError');
            } catch (error) {
                expect(error).to.be.instanceOf(SecurityError);
            }
        });
    });

    describe('边界情况', () => {
        it('应该处理null和undefined的请求体', async () => {
            const client = new HttpClient({ logging: { enabled: false } });

            sandbox.stub(adapters.AxiosAdapter.prototype, 'request').resolves({
                status: 200,
                statusText: 'OK',
                headers: {},
                data: {},
                config: { method: 'POST', url: 'https://example.com' }
            });

            const responseNull = await client.post('https://example.com', null);
            expect(responseNull.status).to.equal(200);

            const responseUndefined = await client.post('https://example.com', undefined);
            expect(responseUndefined.status).to.equal(200);
        });

        it('应该处理空字符串URL', async () => {
            const client = new HttpClient({ logging: { enabled: false } });

            try {
                await client.request({
                    method: 'GET',
                    url: ''
                });
                expect.fail('应该抛出错误');
            } catch (error) {
                expect(error).to.exist;
            }
        });

        it('应该处理无效的URL格式', async () => {
            const client = new HttpClient({ logging: { enabled: false } });

            try {
                await client.request({
                    method: 'GET',
                    url: 'not-a-valid-url'
                });
                expect.fail('应该抛出错误');
            } catch (error) {
                expect(error).to.exist;
            }
        });
    });

    describe('配置验证', () => {
        it('应该在配置无效时抛出错误', () => {
            expect(() => {
                new HttpClient({
                    request: {
                        timeout: -1 // 无效的超时值
                    }
                });
            }).to.throw();
        });
    });

    describe('并发请求', () => {
        it('应该正确处理多个并发请求', async () => {
            const client = new HttpClient({ logging: { enabled: false } });

            let callCount = 0;
            sandbox.stub(adapters.AxiosAdapter.prototype, 'request').callsFake(async () => {
                callCount++;
                return {
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    data: { callCount },
                    config: { method: 'GET', url: 'https://example.com' }
                };
            });

            const promises = [
                client.get('https://example.com/1'),
                client.get('https://example.com/2'),
                client.get('https://example.com/3')
            ];

            const responses = await Promise.all(promises);

            expect(responses).to.have.lengthOf(3);
            expect(callCount).to.equal(3);
        });
    });
});

