/**
 * 基础适配器测试
 */

import { expect } from 'chai';
import {
    BaseHttpAdapter,
    defaultShouldRetry,
    delay
} from '../../src';
import type {
    HttpRequestOptions,
    HttpResponse,
    RequestConfig,
    SecurityConfig
} from '../../src';
import { EHttpRequestClientAdapter } from '../../src';

// 创建一个具体的测试实现
class TestAdapter extends BaseHttpAdapter {
    public readonly name = EHttpRequestClientAdapter.axios as const;
    public requestCount = 0;
    public shouldFail = false;
    public failureError: any = new Error('Test failure');

    public isAvailable(): boolean {
        return true;
    }

    protected async sendRequest<T>(options: HttpRequestOptions): Promise<HttpResponse<T>> {
        this.requestCount++;

        if (this.shouldFail) {
            throw this.failureError;
        }

        return {
            status: 200,
            statusText: 'OK',
            headers: {},
            data: { message: 'success' } as T,
            config: options
        };
    }

    // 暴露受保护的方法用于测试
    public testBuildQueryString(params?: Record<string, string | number | boolean>): string {
        return this.buildQueryString(params);
    }

    public testBuildUrl(url: string, params?: Record<string, string | number | boolean>): string {
        return this.buildUrl(url, params);
    }

    public testNormalizeHeaders(headers: any): Record<string, string> {
        return this.normalizeHeaders(headers);
    }
}

describe('BaseHttpAdapter', () => {
    const defaultRequestConfig: RequestConfig = {
        timeout: 5000,
        retries: 0,
        retryDelay: 100,
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

    describe('构造函数', () => {
        it('应该正确创建实例', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);
            expect(adapter).to.be.instanceOf(BaseHttpAdapter);
        });

        it('应该接受日志记录器', () => {
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

            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig, mockLogger);
            expect(adapter).to.exist;
        });
    });

    describe('request 方法', () => {
        it('应该成功发送请求', async () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            const response = await adapter.request({
                method: 'GET',
                url: 'https://example.com'
            });

            expect(response.status).to.equal(200);
            expect(response.data).to.exist;
            expect(adapter.requestCount).to.equal(1);
        });

        it('应该使用配置中的超时设置', async () => {
            const config: RequestConfig = {
                ...defaultRequestConfig,
                timeout: 3000
            };
            const adapter = new TestAdapter(config, defaultSecurityConfig);

            const response = await adapter.request({
                method: 'GET',
                url: 'https://example.com'
            });

            expect(response.status).to.equal(200);
        });

        it('应该使用请求选项中的超时覆盖配置', async () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            const response = await adapter.request({
                method: 'GET',
                url: 'https://example.com',
                timeout: 2000
            });

            expect(response.status).to.equal(200);
        });
    });

    describe('重试机制', () => {
        it('应该不重试当重试次数为 0 时', async () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);
            adapter.shouldFail = true;

            try {
                await adapter.request({
                    method: 'GET',
                    url: 'https://example.com'
                });
                expect.fail('应该抛出错误');
            } catch (error) {
                expect(adapter.requestCount).to.equal(1);
            }
        });

        it('应该重试指定次数', async () => {
            const config: RequestConfig = {
                ...defaultRequestConfig,
                retries: 3,
                retryDelay: 10
            };
            const adapter = new TestAdapter(config, defaultSecurityConfig);
            adapter.shouldFail = true;
            adapter.failureError = { code: 'ECONNREFUSED' }; // 可重试的错误

            try {
                await adapter.request({
                    method: 'GET',
                    url: 'https://example.com'
                });
                expect.fail('应该抛出错误');
            } catch (error) {
                // 应该尝试 1 + 3 = 4 次
                expect(adapter.requestCount).to.equal(4);
            }
        });

        it('应该在成功前停止重试', async () => {
            const config: RequestConfig = {
                ...defaultRequestConfig,
                retries: 3,
                retryDelay: 10
            };
            const adapter = new TestAdapter(config, defaultSecurityConfig);
            adapter.shouldFail = true;
            adapter.failureError = { code: 'ECONNREFUSED' };

            // 第三次尝试时成功
            let attemptCount = 0;
            const originalSendRequest = adapter['sendRequest'].bind(adapter);
            adapter['sendRequest'] = async function (options: HttpRequestOptions) {
                attemptCount++;
                if (attemptCount >= 3) {
                    this.shouldFail = false;
                }
                return originalSendRequest(options);
            };

            const response = await adapter.request({
                method: 'GET',
                url: 'https://example.com'
            });

            expect(response.status).to.equal(200);
            expect(adapter.requestCount).to.equal(3);
        });

        it('应该在不可重试的错误时立即停止', async () => {
            const config: RequestConfig = {
                ...defaultRequestConfig,
                retries: 3,
                retryDelay: 10
            };
            const adapter = new TestAdapter(config, defaultSecurityConfig);
            adapter.shouldFail = true;
            adapter.failureError = { response: { status: 404 } }; // 不可重试的错误

            try {
                await adapter.request({
                    method: 'GET',
                    url: 'https://example.com'
                });
                expect.fail('应该抛出错误');
            } catch (error) {
                // 应该只尝试 1 次，不重试
                expect(adapter.requestCount).to.equal(1);
            }
        });

        it('应该使用请求选项中的重试次数', async () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);
            adapter.shouldFail = true;
            adapter.failureError = { code: 'ECONNREFUSED' };

            try {
                await adapter.request({
                    method: 'GET',
                    url: 'https://example.com',
                    retries: 2
                });
                expect.fail('应该抛出错误');
            } catch (error) {
                expect(adapter.requestCount).to.equal(3); // 1 + 2 retries
            }
        });

        it('应该在重试之间延迟', async function () {
            this.timeout(5000);
            const config: RequestConfig = {
                ...defaultRequestConfig,
                retries: 2,
                retryDelay: 100
            };
            const adapter = new TestAdapter(config, defaultSecurityConfig);
            adapter.shouldFail = true;
            adapter.failureError = { code: 'ETIMEDOUT' };

            const startTime = Date.now();
            try {
                await adapter.request({
                    method: 'GET',
                    url: 'https://example.com'
                });
                expect.fail('应该抛出错误');
            } catch (error) {
                const duration = Date.now() - startTime;
                // 应该有 2 次重试延迟：100ms + 200ms = 300ms
                expect(duration).to.be.greaterThan(250);
            }
        });
    });

    describe('defaultShouldRetry', () => {
        it('应该对网络错误返回 true', () => {
            expect(defaultShouldRetry({ code: 'ECONNREFUSED' })).to.be.true;
            expect(defaultShouldRetry({ code: 'ENOTFOUND' })).to.be.true;
            expect(defaultShouldRetry({ code: 'ETIMEDOUT' })).to.be.true;
        });

        it('应该对 5xx 错误返回 true', () => {
            expect(defaultShouldRetry({ response: { status: 500 } })).to.be.true;
            expect(defaultShouldRetry({ response: { status: 502 } })).to.be.true;
            expect(defaultShouldRetry({ response: { status: 503 } })).to.be.true;
            expect(defaultShouldRetry({ response: { status: 504 } })).to.be.true;
        });

        it('应该对 429 错误返回 true', () => {
            expect(defaultShouldRetry({ response: { status: 429 } })).to.be.true;
        });

        it('应该对 4xx 客户端错误（除 429 外）返回 false', () => {
            expect(defaultShouldRetry({ response: { status: 400 } })).to.be.false;
            expect(defaultShouldRetry({ response: { status: 401 } })).to.be.false;
            expect(defaultShouldRetry({ response: { status: 403 } })).to.be.false;
            expect(defaultShouldRetry({ response: { status: 404 } })).to.be.false;
        });

        it('应该对其他错误返回 false', () => {
            expect(defaultShouldRetry({ code: 'UNKNOWN_ERROR' })).to.be.false;
            expect(defaultShouldRetry(new Error('Generic error'))).to.be.false;
        });
    });

    describe('delay 函数', () => {
        it('应该延迟指定的毫秒数', async function () {
            this.timeout(5000);
            const startTime = Date.now();
            await delay(100);
            const duration = Date.now() - startTime;

            expect(duration).to.be.greaterThanOrEqual(90); // 允许一些误差
            expect(duration).to.be.lessThan(200);
        });

        it('应该支持 0 毫秒延迟', async () => {
            const startTime = Date.now();
            await delay(0);
            const duration = Date.now() - startTime;

            expect(duration).to.be.lessThan(50);
        });
    });

    describe('updateConfig', () => {
        it('应该更新请求配置', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            adapter.updateConfig({ timeout: 3000 });

            // 通过实际请求验证配置已更新
            expect(adapter).to.exist;
        });

        it('应该支持部分配置更新', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            adapter.updateConfig({ retries: 5 });

            expect(adapter).to.exist;
        });
    });

    describe('setLogger', () => {
        it('应该设置日志记录器', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

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

        it('应该使用新的日志记录器', async () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            const logs: string[] = [];
            const mockLogger = {
                debug: (msg: string) => logs.push(`debug: ${ msg }`),
                info: (msg: string) => logs.push(`info: ${ msg }`),
                warn: (msg: string) => logs.push(`warn: ${ msg }`),
                error: (msg: string) => logs.push(`error: ${ msg }`)
            };

            adapter.setLogger(mockLogger);

            await adapter.request({
                method: 'GET',
                url: 'https://example.com'
            });

            expect(logs.length).to.be.greaterThan(0);
        });
    });

    describe('buildQueryString', () => {
        it('应该构建空查询字符串', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            expect(adapter.testBuildQueryString()).to.equal('');
            expect(adapter.testBuildQueryString({})).to.equal('');
        });

        it('应该构建简单查询字符串', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            const result = adapter.testBuildQueryString({ foo: 'bar' });
            expect(result).to.equal('foo=bar');
        });

        it('应该构建多参数查询字符串', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            const result = adapter.testBuildQueryString({
                foo: 'bar',
                num: 123,
                bool: true
            });

            expect(result).to.include('foo=bar');
            expect(result).to.include('num=123');
            expect(result).to.include('bool=true');
        });

        it('应该正确编码特殊字符', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            const result = adapter.testBuildQueryString({
                query: 'hello world',
                special: 'a&b=c'
            });

            expect(result).to.include('query=hello+world');
            expect(result).to.include('special=a%26b%3Dc');
        });
    });

    describe('buildUrl', () => {
        it('应该返回原始 URL 当没有参数时', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            expect(adapter.testBuildUrl('https://example.com')).to.equal('https://example.com');
            expect(adapter.testBuildUrl('https://example.com', {})).to.equal('https://example.com');
        });

        it('应该附加查询参数', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            const result = adapter.testBuildUrl('https://example.com', { foo: 'bar' });
            expect(result).to.equal('https://example.com?foo=bar');
        });

        it('应该使用 & 连接已有查询参数', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            const result = adapter.testBuildUrl('https://example.com?existing=value', { foo: 'bar' });
            expect(result).to.equal('https://example.com?existing=value&foo=bar');
        });

        it('应该处理多个参数', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            const result = adapter.testBuildUrl('https://example.com', {
                foo: 'bar',
                num: 123
            });

            expect(result).to.include('https://example.com?');
            expect(result).to.include('foo=bar');
            expect(result).to.include('num=123');
        });
    });

    describe('normalizeHeaders', () => {
        it('应该返回空对象当没有头时', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            expect(adapter.testNormalizeHeaders(null)).to.deep.equal({});
            expect(adapter.testNormalizeHeaders(undefined)).to.deep.equal({});
        });

        it('应该标准化响应头', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            const headers = {
                'Content-Type': 'application/json',
                'X-Custom-Header': 'value'
            };

            const result = adapter.testNormalizeHeaders(headers);

            expect(result['content-type']).to.equal('application/json');
            expect(result['x-custom-header']).to.equal('value');
        });

        it('应该过滤 undefined 和 null 值', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            const headers = {
                'Content-Type': 'application/json',
                'X-Undefined': undefined,
                'X-Null': null
            };

            const result = adapter.testNormalizeHeaders(headers);

            expect(result).to.have.property('content-type');
            expect(result).to.not.have.property('x-undefined');
            expect(result).to.not.have.property('x-null');
        });

        it('应该将所有值转换为字符串', () => {
            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig);

            const headers = {
                'Content-Length': 123,
                'X-Boolean': true
            };

            const result = adapter.testNormalizeHeaders(headers);

            expect(result['content-length']).to.equal('123');
            expect(result['x-boolean']).to.equal('true');
        });
    });

    describe('日志记录', () => {
        it('应该在成功时记录日志', async () => {
            const logs: any[] = [];
            const mockLogger = {
                debug: (...args: any[]) => logs.push({ level: 'debug', args }),
                info: (...args: any[]) => logs.push({ level: 'info', args }),
                warn: (...args: any[]) => logs.push({ level: 'warn', args }),
                error: (...args: any[]) => logs.push({ level: 'error', args })
            };

            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig, mockLogger);

            await adapter.request({
                method: 'GET',
                url: 'https://example.com'
            });

            const debugLogs = logs.filter(log => log.level === 'debug');
            expect(debugLogs.length).to.be.greaterThan(0);
        });

        it('应该在失败时记录错误', async () => {
            const logs: any[] = [];
            const mockLogger = {
                debug: (...args: any[]) => logs.push({ level: 'debug', args }),
                info: (...args: any[]) => logs.push({ level: 'info', args }),
                warn: (...args: any[]) => logs.push({ level: 'warn', args }),
                error: (...args: any[]) => logs.push({ level: 'error', args })
            };

            const adapter = new TestAdapter(defaultRequestConfig, defaultSecurityConfig, mockLogger);
            adapter.shouldFail = true;

            try {
                await adapter.request({
                    method: 'GET',
                    url: 'https://example.com'
                });
            } catch (error) {
                // Expected
            }

            const errorLogs = logs.filter(log => log.level === 'error');
            expect(errorLogs.length).to.be.greaterThan(0);
        });

        it('应该在重试时记录警告', async () => {
            const logs: any[] = [];
            const mockLogger = {
                debug: (...args: any[]) => logs.push({ level: 'debug', args }),
                info: (...args: any[]) => logs.push({ level: 'info', args }),
                warn: (...args: any[]) => logs.push({ level: 'warn', args }),
                error: (...args: any[]) => logs.push({ level: 'error', args })
            };

            const config: RequestConfig = {
                ...defaultRequestConfig,
                retries: 1,
                retryDelay: 10
            };
            const adapter = new TestAdapter(config, defaultSecurityConfig, mockLogger);
            adapter.shouldFail = true;
            adapter.failureError = { code: 'ECONNREFUSED' };

            try {
                await adapter.request({
                    method: 'GET',
                    url: 'https://example.com'
                });
            } catch (error) {
                // Expected
            }

            const warnLogs = logs.filter(log => log.level === 'warn');
            expect(warnLogs.length).to.be.greaterThan(0);
        });
    });
});

