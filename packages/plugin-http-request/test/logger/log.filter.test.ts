/**
 * 日志过滤器测试
 */

import { expect } from 'chai';
import { LogFilter } from '../../src';
import type {
    IResSuccessOptions,
    IResFailedOptions
} from '../../src';

describe('LogFilter', () => {
    // 辅助函数：创建成功的请求选项
    const createSuccessOptions = (overrides?: Partial<IResSuccessOptions>): IResSuccessOptions => ({
        isSuccess: true,
        timestamp: Date.now(),
        request: {
            method: 'GET',
            url: 'https://example.com/api/users',
            scenario: 'test'
        },
        response: {
            status: 200,
            statusText: 'OK',
            headers: {},
            data: {},
            config: {} as any
        },
        duration: 100,
        retryCount: 0,
        ...overrides
    });

    // 辅助函数：创建失败的请求选项
    const createFailedOptions = (overrides?: Partial<IResFailedOptions>): IResFailedOptions => ({
        isSuccess: false,
        timestamp: Date.now(),
        request: {
            method: 'POST',
            url: 'https://example.com/api/orders',
            scenario: 'test'
        },
        error: new Error('Request failed'),
        errorCode: 'NETWORK_ERROR',
        status: 500,
        duration: 200,
        retryCount: 2,
        ...overrides
    });

    describe('Basic filtering', () => {
        it('应该在未配置过滤器时通过所有请求', () => {
            const filter = new LogFilter();

            expect(filter.shouldLog(createSuccessOptions())).to.be.true;
            expect(filter.shouldLog(createFailedOptions())).to.be.true;
        });

        it('应该只在 onlyFailed 为 true 时记录失败的请求', () => {
            const filter = new LogFilter({ onlyFailed: true });

            expect(filter.shouldLog(createSuccessOptions())).to.be.false;
            expect(filter.shouldLog(createFailedOptions())).to.be.true;
        });

        it('应该只在 onlySuccess 为 true 时记录成功的请求', () => {
            const filter = new LogFilter({ onlySuccess: true });

            expect(filter.shouldLog(createSuccessOptions())).to.be.true;
            expect(filter.shouldLog(createFailedOptions())).to.be.false;
        });
    });

    describe('HTTP method filtering', () => {
        it('应该按 HTTP 方法过滤', () => {
            const filter = new LogFilter({ methods: ['POST', 'PUT'] });

            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'GET', url: 'test' }
            }))).to.be.false;

            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'POST', url: 'test' }
            }))).to.be.true;

            expect(filter.shouldLog(createFailedOptions({
                request: { method: 'PUT', url: 'test' }
            }))).to.be.true;
        });
    });

    describe('URL pattern filtering', () => {
        it('应该按字符串 URL 模式过滤', () => {
            const filter = new LogFilter({ urlPatterns: ['/api/', 'payment'] });

            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'GET', url: 'https://example.com/api/users' }
            }))).to.be.true;

            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'GET', url: 'https://example.com/payment' }
            }))).to.be.true;

            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'GET', url: 'https://example.com/about' }
            }))).to.be.false;
        });

        it('应该按正则表达式 URL 模式过滤', () => {
            const filter = new LogFilter({
                urlPatterns: [/\/api\/users\/\d+/, /\/orders\/[a-z0-9]+/i]
            });

            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'GET', url: 'https://example.com/api/users/123' }
            }))).to.be.true;

            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'GET', url: 'https://example.com/orders/abc123' }
            }))).to.be.true;

            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'GET', url: 'https://example.com/api/products' }
            }))).to.be.false;
        });
    });

    describe('Scenario filtering', () => {
        it('应该按场景过滤', () => {
            const filter = new LogFilter({ scenarios: ['user-login', 'payment'] });

            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'GET', url: 'test', scenario: 'user-login' }
            }))).to.be.true;

            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'GET', url: 'test', scenario: 'payment' }
            }))).to.be.true;

            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'GET', url: 'test', scenario: 'data-fetch' }
            }))).to.be.false;
        });

        it('应该在设置场景过滤器时拒绝没有场景的请求', () => {
            const filter = new LogFilter({ scenarios: ['user-login'] });

            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'GET', url: 'test', scenario: undefined }
            }))).to.be.false;
        });
    });

    describe('Status code filtering', () => {
        it('应该按特定状态码过滤', () => {
            const filter = new LogFilter({ statusCodes: [401, 403, 404, 500] });

            expect(filter.shouldLog(createSuccessOptions({
                response: { status: 200, statusText: 'OK', headers: {}, data: {}, config: {} as any }
            }))).to.be.false;

            expect(filter.shouldLog(createSuccessOptions({
                response: { status: 404, statusText: 'Not Found', headers: {}, data: {}, config: {} as any }
            }))).to.be.true;

            expect(filter.shouldLog(createFailedOptions({ status: 500 }))).to.be.true;
            expect(filter.shouldLog(createFailedOptions({ status: 200 }))).to.be.false;
        });

        it('应该按状态码范围过滤', () => {
            const filter = new LogFilter({
                statusCodeRanges: [
                    { min: 400, max: 499 },
                    { min: 500, max: 599 }
                ]
            });

            expect(filter.shouldLog(createSuccessOptions({
                response: { status: 200, statusText: 'OK', headers: {}, data: {}, config: {} as any }
            }))).to.be.false;

            expect(filter.shouldLog(createSuccessOptions({
                response: { status: 404, statusText: 'Not Found', headers: {}, data: {}, config: {} as any }
            }))).to.be.true;

            expect(filter.shouldLog(createFailedOptions({ status: 500 }))).to.be.true;
            expect(filter.shouldLog(createFailedOptions({ status: 302 }))).to.be.false;
        });

        it('状态码缺失时应直接通过', () => {
            const filter = new LogFilter({ statusCodes: [500] });

            expect(filter.shouldLog(createFailedOptions({ status: undefined }))).to.be.true;
        });
    });

    describe('Duration filtering', () => {
        it('应该按最小持续时间过滤', () => {
            const filter = new LogFilter({ minDuration: 1000 });

            expect(filter.shouldLog(createSuccessOptions({ duration: 500 }))).to.be.false;
            expect(filter.shouldLog(createSuccessOptions({ duration: 1000 }))).to.be.true;
            expect(filter.shouldLog(createSuccessOptions({ duration: 1500 }))).to.be.true;
            expect(filter.shouldLog(createFailedOptions({ duration: 2000 }))).to.be.true;
        });

        it('未提供 duration 时应默认通过', () => {
            const filter = new LogFilter({ minDuration: 1000 });
            expect(filter.shouldLog(createSuccessOptions({ duration: undefined }))).to.be.true;
            expect(filter.shouldLog(createFailedOptions({ duration: undefined }))).to.be.true;
        });
    });

    describe('Custom filter', () => {
        it('应该使用自定义过滤函数', () => {
            const filter = new LogFilter({
                customFilter: (options) => {
                    // 只记录管理员用户的请求
                    return options.request.meta?.userId === 'admin';
                }
            });

            expect(filter.shouldLog(createSuccessOptions({
                request: {
                    method: 'GET',
                    url: 'test',
                    meta: { userId: 'admin' }
                }
            }))).to.be.true;

            expect(filter.shouldLog(createSuccessOptions({
                request: {
                    method: 'GET',
                    url: 'test',
                    meta: { userId: 'user123' }
                }
            }))).to.be.false;

            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'GET', url: 'test' }
            }))).to.be.false;
        });
    });

    describe('Config update', () => {
        it('updateConfig 应合并新配置', () => {
            const filter = new LogFilter({ methods: ['GET'] });
            filter.updateConfig({ onlyFailed: true, methods: ['POST'] });
            const opts = createFailedOptions({ request: { method: 'POST', url: 'https://example.com' } });

            expect(filter.shouldLog(opts)).to.be.true;
            // 成功请求应被 onlyFailed 拦截
            expect(filter.shouldLog(createSuccessOptions({ request: { method: 'POST', url: 'https://example.com' } }))).to.be.false;
        });

        it('getConfig 应返回浅拷贝', () => {
            const filter = new LogFilter({ methods: ['GET'] });
            const cfg = filter.getConfig();
            // 返回对象不是同一个引用
            expect(cfg).to.not.equal(filter.getConfig());
            // 基本字段保持一致
            expect(cfg.methods).to.deep.equal(['GET']);
        });
    });

    describe('Combined filters', () => {
        it('应该应用所有过滤器（AND 逻辑）', () => {
            const filter = new LogFilter({
                methods: ['POST', 'PUT'],
                urlPatterns: ['/api/'],
                statusCodeRanges: [{ min: 400, max: 599 }],
                minDuration: 500
            });

            // 满足所有条件
            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'POST', url: 'https://example.com/api/users' },
                response: { status: 500, statusText: 'Error', headers: {}, data: {}, config: {} as any },
                duration: 600
            }))).to.be.true;

            // 不满足 method
            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'GET', url: 'https://example.com/api/users' },
                response: { status: 500, statusText: 'Error', headers: {}, data: {}, config: {} as any },
                duration: 600
            }))).to.be.false;

            // 不满足 URL pattern
            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'POST', url: 'https://example.com/about' },
                response: { status: 500, statusText: 'Error', headers: {}, data: {}, config: {} as any },
                duration: 600
            }))).to.be.false;

            // 不满足 status code
            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'POST', url: 'https://example.com/api/users' },
                response: { status: 200, statusText: 'OK', headers: {}, data: {}, config: {} as any },
                duration: 600
            }))).to.be.false;

            // 不满足 duration
            expect(filter.shouldLog(createSuccessOptions({
                request: { method: 'POST', url: 'https://example.com/api/users' },
                response: { status: 500, statusText: 'Error', headers: {}, data: {}, config: {} as any },
                duration: 300
            }))).to.be.false;
        });
    });

    describe('Config management', () => {
        it('应该允许更新配置', () => {
            const filter = new LogFilter({ onlyFailed: true });

            expect(filter.shouldLog(createSuccessOptions())).to.be.false;

            filter.updateConfig({ onlyFailed: false, onlySuccess: true });

            expect(filter.shouldLog(createSuccessOptions())).to.be.true;
            expect(filter.shouldLog(createFailedOptions())).to.be.false;
        });

        it('应该允许获取当前配置', () => {
            const config = {
                onlyFailed: true,
                methods: ['POST'],
                minDuration: 1000
            };
            const filter = new LogFilter(config);

            const currentConfig = filter.getConfig();
            expect(currentConfig.onlyFailed).to.be.true;
            expect(currentConfig.methods).to.deep.equal(['POST']);
            expect(currentConfig.minDuration).to.equal(1000);
        });
    });
});

