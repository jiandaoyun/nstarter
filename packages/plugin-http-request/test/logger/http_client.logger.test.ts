/**
 * HTTP 客户端日志记录器测试
 */

import { expect } from 'chai';
import { NsHttpClientLogger } from '../../src';
import { LogFilter } from '../../src';
import type {
    ILogger,
    IResSuccessOptions,
    IResFailedOptions
} from '../../src';

describe('NsHttpClientLogger', () => {
    // 模拟日志记录器
    class MockLogger implements ILogger {
        public logs: Array<{ level: string; message: string; meta?: any }> = [];

        debug(message: string, meta?: Record<string, any>): void {
            this.logs.push({ level: 'debug', message, meta });
        }

        info(message: string, meta?: Record<string, any>): void {
            this.logs.push({ level: 'info', message, meta });
        }

        warn(message: string, meta?: Record<string, any>): void {
            this.logs.push({ level: 'warn', message, meta });
        }

        error(message: string, meta?: Record<string, any>): void {
            this.logs.push({ level: 'error', message, meta });
        }

        clear(): void {
            this.logs = [];
        }
    }

    // 辅助函数：创建成功的请求选项
    const createSuccessOptions = (overrides?: any): Omit<IResSuccessOptions, 'isSuccess' | 'timestamp'> => ({
        request: {
            method: 'GET',
            url: 'https://example.com/api/users',
            scenario: 'test',
            body: { test: 'data' }
        },
        response: {
            status: 200,
            statusText: 'OK',
            headers: { 'content-type': 'application/json' },
            data: { users: [{ id: 1, name: 'Test' }] },
            config: {} as any
        },
        duration: 100,
        retryCount: 0,
        ...overrides
    });

    // 辅助函数：创建失败的请求选项
    const createFailedOptions = (overrides?: any): Omit<IResFailedOptions, 'isSuccess' | 'timestamp'> => ({
        request: {
            method: 'POST',
            url: 'https://example.com/api/orders',
            scenario: 'test',
            body: { order: 'data' }
        },
        error: new Error('Request failed'),
        errorCode: 'NETWORK_ERROR',
        status: 500,
        duration: 200,
        retryCount: 2,
        ...overrides
    });

    describe('Basic logging', () => {
        it('应该记录成功的请求', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: false,
                logResponseBody: false
            });

            httpLogger.logSuccess(createSuccessOptions());

            expect(mockLogger.logs).to.have.lengthOf(1);
            expect(mockLogger.logs[0].level).to.equal('info');
            expect(mockLogger.logs[0].message).to.include('succeeded');
            expect(mockLogger.logs[0].meta.status).to.equal(200);
            expect(mockLogger.logs[0].meta.duration).to.equal(100);
        });

        it('应该记录失败的请求', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: false,
                logResponseBody: false
            });

            httpLogger.logFailed(createFailedOptions());

            expect(mockLogger.logs).to.have.lengthOf(1);
            expect(mockLogger.logs[0].level).to.equal('error');
            expect(mockLogger.logs[0].message).to.include('failed');
            expect(mockLogger.logs[0].meta.error).to.equal('Request failed');
            expect(mockLogger.logs[0].meta.status).to.equal(500);
        });
    });

    describe('Request/Response body logging', () => {
        it('应该在启用时记录请求体', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: true,
                logResponseBody: false
            });

            httpLogger.logSuccess(createSuccessOptions());

            expect(mockLogger.logs[0].meta.requestBody).to.exist;
        });

        it('应该在启用时记录响应体', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: false,
                logResponseBody: true
            });

            httpLogger.logSuccess(createSuccessOptions());

            expect(mockLogger.logs[0].meta.responseBody).to.exist;
        });

        it('应该截断过大的请求体', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: true,
                logResponseBody: true,
                bodyMaxLength: 10
            });

            const largeBody = 'x'.repeat(100);
            httpLogger.logSuccess(createSuccessOptions({
                request: {
                    method: 'POST',
                    url: 'test',
                    body: largeBody
                },
                response: {
                    status: 200,
                    statusText: 'OK',
                    headers: {},
                    data: largeBody,
                    config: {} as any
                }
            }));

            const log = mockLogger.logs[0];
            expect(log.meta.requestBody).to.include('truncated');
            expect(log.meta.responseBody).to.include('truncated');
        });
    });

    describe('Filter integration', () => {
        it('应该在过滤器返回 false 时不记录', () => {
            const mockLogger = new MockLogger();
            const filter = new LogFilter({ onlyFailed: true });
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                filter
            });

            // 尝试记录成功的请求（应该被过滤掉）
            httpLogger.logSuccess(createSuccessOptions());
            expect(mockLogger.logs).to.have.lengthOf(0);

            // 记录失败的请求（应该通过）
            httpLogger.logFailed(createFailedOptions());
            expect(mockLogger.logs).to.have.lengthOf(1);
        });

        it('应该在过滤器返回 true 时记录', () => {
            const mockLogger = new MockLogger();
            const filter = new LogFilter({
                methods: ['GET'],
                minDuration: 50
            });
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                filter
            });

            // 满足过滤条件
            httpLogger.logSuccess(createSuccessOptions({
                request: { method: 'GET', url: 'test' },
                duration: 100
            }));
            expect(mockLogger.logs).to.have.lengthOf(1);

            mockLogger.clear();

            // 不满足过滤条件（POST 方法）
            httpLogger.logSuccess(createSuccessOptions({
                request: { method: 'POST', url: 'test' },
                duration: 100
            }));
            expect(mockLogger.logs).to.have.lengthOf(0);
        });
    });

    describe('Static factory method', () => {
        it('应该使用工厂方法创建日志记录器', () => {
            const mockLogger = new MockLogger();
            const httpLogger = NsHttpClientLogger.create(
                mockLogger,
                { onlyFailed: true },
                {
                    logRequestBody: true,
                    logResponseBody: true,
                    bodyMaxLength: 2048
                }
            );

            // 测试过滤器
            httpLogger.logSuccess(createSuccessOptions());
            expect(mockLogger.logs).to.have.lengthOf(0);

            httpLogger.logFailed(createFailedOptions());
            expect(mockLogger.logs).to.have.lengthOf(1);
        });

        it('应该创建不带过滤器的日志记录器', () => {
            const mockLogger = new MockLogger();
            const httpLogger = NsHttpClientLogger.create(mockLogger);

            httpLogger.logSuccess(createSuccessOptions());
            httpLogger.logFailed(createFailedOptions());

            expect(mockLogger.logs).to.have.lengthOf(2);
        });
    });

    describe('Metadata handling', () => {
        it('应该在元数据中包含场景', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({ logger: mockLogger });

            httpLogger.logSuccess(createSuccessOptions({
                request: { method: 'GET', url: 'test', scenario: 'user-login' }
            }));

            expect(mockLogger.logs[0].meta.scenario).to.equal('user-login');
        });

        it('应该包含请求元数据', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({ logger: mockLogger });

            httpLogger.logSuccess(createSuccessOptions({
                request: {
                    method: 'GET',
                    url: 'test',
                    meta: { userId: 'admin', traceId: '123' }
                }
            }));

            expect(mockLogger.logs[0].meta.requestMeta).to.deep.equal({
                userId: 'admin',
                traceId: '123'
            });
        });

        it('应该包含重试次数', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({ logger: mockLogger });

            httpLogger.logFailed(createFailedOptions({ retryCount: 3 }));

            expect(mockLogger.logs[0].meta.retryCount).to.equal(3);
        });
    });

    describe('Special body types handling', () => {
        it('应该正确处理 null 类型的 body', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: true
            });

            httpLogger.logSuccess(createSuccessOptions({
                request: {
                    method: 'POST',
                    url: 'https://example.com',
                    body: null
                }
            }));

            expect(mockLogger.logs[0].meta.requestBody).to.equal('# --- null --- #');
        });

        it('应该正确处理 undefined 类型的 body', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: true
            });

            httpLogger.logSuccess(createSuccessOptions({
                request: {
                    method: 'POST',
                    url: 'https://example.com',
                    body: undefined
                }
            }));

            expect(mockLogger.logs[0].meta.requestBody).to.equal('# --- undefined --- #');
        });

        it('应该正确处理 Buffer 类型的 body', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: true
            });

            const buffer = Buffer.from('test data');
            httpLogger.logSuccess(createSuccessOptions({
                request: {
                    method: 'POST',
                    url: 'https://example.com',
                    body: buffer
                }
            }));

            const requestBody = mockLogger.logs[0].meta.requestBody;
            expect(requestBody).to.include('# --- buffer');
            expect(requestBody).to.include('bytes');
            expect(requestBody).to.include('9'); // 'test data' is 9 bytes
        });

        it('应该正确处理 Stream 类型的 body', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: true
            });

            // 模拟 Stream 对象
            const mockStream = {
                pipe: () => {
                },
                read: () => {
                },
                on: () => {
                }
            };

            httpLogger.logSuccess(createSuccessOptions({
                request: {
                    method: 'POST',
                    url: 'https://example.com',
                    body: mockStream
                }
            }));

            expect(mockLogger.logs[0].meta.requestBody).to.equal('# --- stream --- #');
        });

        it('应该正确处理 number 类型的 body', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: true
            });

            httpLogger.logSuccess(createSuccessOptions({
                request: {
                    method: 'POST',
                    url: 'https://example.com',
                    body: 123
                }
            }));

            expect(mockLogger.logs[0].meta.requestBody).to.equal(123);
        });

        it('应该正确处理 boolean 类型的 body', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: true
            });

            httpLogger.logSuccess(createSuccessOptions({
                request: {
                    method: 'POST',
                    url: 'https://example.com',
                    body: false
                }
            }));

            expect(mockLogger.logs[0].meta.requestBody).to.equal(false);
        });

        it('应该正确处理字符串类型的 body', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: true
            });

            httpLogger.logSuccess(createSuccessOptions({
                request: {
                    method: 'POST',
                    url: 'https://example.com',
                    body: 'simple string'
                }
            }));

            expect(mockLogger.logs[0].meta.requestBody).to.equal('simple string');
        });

        it('应该截断过长的字符串 body', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: true,
                bodyMaxLength: 10
            });

            httpLogger.logSuccess(createSuccessOptions({
                request: {
                    method: 'POST',
                    url: 'https://example.com',
                    body: 'This is a very long string that should be truncated'
                }
            }));

            const requestBody = mockLogger.logs[0].meta.requestBody;
            expect(requestBody).to.include('This is a ');
            expect(requestBody).to.include('(truncated)');
        });

        it('应该截断过大的对象 body', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: true,
                bodyMaxLength: 20
            });

            const largeObject = {
                field1: 'very long value 1',
                field2: 'very long value 2',
                field3: 'very long value 3'
            };

            httpLogger.logSuccess(createSuccessOptions({
                request: {
                    method: 'POST',
                    url: 'https://example.com',
                    body: largeObject
                }
            }));

            const requestBody = mockLogger.logs[0].meta.requestBody;
            expect(requestBody).to.be.a('string');
            expect(requestBody).to.include('(truncated)');
        });

        it('应该处理无法序列化的对象', () => {
            const mockLogger = new MockLogger();
            const httpLogger = new NsHttpClientLogger({
                logger: mockLogger,
                logRequestBody: true
            });

            // 创建循环引用对象
            const circular: any = { name: 'test' };
            circular.self = circular;

            httpLogger.logSuccess(createSuccessOptions({
                request: {
                    method: 'POST',
                    url: 'https://example.com',
                    body: circular
                }
            }));

            expect(mockLogger.logs[0].meta.requestBody).to.equal('[unable to serialize body]');
        });
    });
});

