/**
 * 集成测试
 * 注意：axios 使用 nock，undici 使用 MockAgent 进行 HTTP mock
 */

import { expect } from 'chai';
// @ts-ignore
import nock from 'nock';
import {
    MockAgent,
    setGlobalDispatcher,
    getGlobalDispatcher
} from 'undici';
import { NsHttpClient } from '../../src';
import { SecurityError } from '../../src';
import { EClientAdapter } from '../../src';

describe('NsHttpClient Integration Tests', function () {
    this.timeout(10000);
    let mockAgent: MockAgent;
    let originalDispatcher: any;

    beforeEach(() => {
        // 保存原始 dispatcher
        originalDispatcher = getGlobalDispatcher();
        // 为 undici 设置 MockAgent
        mockAgent = new MockAgent();
        mockAgent.disableNetConnect();
        setGlobalDispatcher(mockAgent);
        // 为 nock 禁用网络连接，确保所有请求都被拦截
        nock.disableNetConnect();
    });

    afterEach(async () => {
        nock.cleanAll();
        nock.enableNetConnect(); // 恢复网络连接
        await mockAgent.close();
        // 恢复原始 dispatcher
        if (originalDispatcher) {
            setGlobalDispatcher(originalDispatcher);
        }
    });

    describe('Basic HTTP requests', () => {
        it('应该使用 axios 成功发送 GET 请求', async () => {
            nock('https://httpbin.nstarter')
                .get('/get')
                .reply(200, {
                    args: {},
                    headers: {},
                    url: 'https://httpbin.nstarter/get'
                });

            const client = new NsHttpClient({
                adapter: EClientAdapter.axios,
                security: {
                    enableDnsValidation: false
                },
                logging: { enabled: false }
            });

            const response = await client.get('https://httpbin.nstarter/get');
            expect(response.status).to.equal(200);
            expect(response.data).to.exist;
        });

        it('应该使用 undici 成功发送 GET 请求', async () => {
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/get',
                method: 'GET'
            }).reply(200, {
                args: {},
                headers: {},
                url: 'https://httpbin.nstarter/get'
            });

            const client = new NsHttpClient({
                adapter: EClientAdapter.undici,
                security: {
                    enableDnsValidation: false
                },
                logging: { enabled: false }
            });

            const response = await client.get('https://httpbin.nstarter/get');
            expect(response.status).to.equal(200);
            expect(response.data).to.exist;
        });

        it('应该成功发送 POST 请求', async () => {
            nock('https://httpbin.nstarter')
                .post('/post', {
                    test: 'data'
                })
                .reply(200, {
                    json: { test: 'data' }
                });

            const client = new NsHttpClient({
                adapter: EClientAdapter.axios,
                security: {
                    enableDnsValidation: false
                },
                logging: { enabled: false }
            });

            const response = await client.post('https://httpbin.nstarter/post', {
                test: 'data'
            });
            expect(response.status).to.equal(200);
            expect(response.data).to.exist;
        });
    });

    describe('Security validations', () => {
        it('应该阻止对回环地址的请求', async () => {
            const client = new NsHttpClient({
                adapter: EClientAdapter.axios,
                security: {
                    enableIpValidation: true,
                    enableDnsValidation: false,
                    allowPrivateIp: false
                },
                logging: { enabled: false }
            });

            try {
                await client.get('http://127.0.0.1:8080');
                expect.fail('Should have thrown SecurityError');
            } catch (error) {
                expect(error).to.be.instanceOf(SecurityError);
            }
        });

        it('应该阻止对私有 IP 地址的请求', async () => {
            const client = new NsHttpClient({
                adapter: EClientAdapter.axios,
                security: {
                    enableIpValidation: true,
                    enableDnsValidation: false,
                    allowPrivateIp: false
                },
                logging: { enabled: false }
            });

            try {
                await client.get('http://192.168.1.1');
                expect.fail('Should have thrown SecurityError');
            } catch (error) {
                expect(error).to.be.instanceOf(SecurityError);
            }
        });

        it('应该在启用时允许对私有 IP 的请求', async () => {
            const client = new NsHttpClient({
                adapter: EClientAdapter.axios,
                security: {
                    enableIpValidation: true,
                    enableDnsValidation: false,
                    allowPrivateIp: true
                },
                logging: { enabled: false }
            });

            // 这个测试只是确保不会抛出 SecurityError
            // 实际的连接可能失败（ECONNREFUSED），这是正常的
            try {
                await client.get('http://192.168.1.1:8080', { timeout: 1000 });
            } catch (error: any) {
                // 确保不是 SecurityError
                expect(error).to.not.be.instanceOf(SecurityError);
            }
        });

        it('应该强制执行白名单', async () => {
            const client = new NsHttpClient({
                adapter: EClientAdapter.axios,
                security: {
                    whitelist: ['httpbin.nstarter'],
                    enableDnsValidation: false
                },
                logging: { enabled: false }
            });

            try {
                await client.get('https://google.com');
                expect.fail('Should have thrown SecurityError');
            } catch (error) {
                expect(error).to.be.instanceOf(SecurityError);
            }
        });

        it('应该强制执行黑名单', async () => {
            const client = new NsHttpClient({
                adapter: EClientAdapter.axios,
                security: {
                    blacklist: ['bad.example.com'],
                    enableDnsValidation: false
                },
                logging: { enabled: false }
            });

            try {
                await client.get('https://bad.example.com');
                expect.fail('Should have thrown SecurityError');
            } catch (error) {
                expect(error).to.be.instanceOf(SecurityError);
            }
        });
    });

    describe('Error handling', () => {
        it('应该处理超时错误', async () => {
            nock('https://httpbin.nstarter')
                .get('/delay/5')
                .delayConnection(5000)
                .reply(200);

            const client = new NsHttpClient({
                adapter: EClientAdapter.axios,
                security: {
                    enableDnsValidation: false
                },
                request: { timeout: 100 }, // 100ms timeout
                logging: { enabled: false }
            });

            try {
                await client.get('https://httpbin.nstarter/delay/5');
                expect.fail('Should have thrown timeout error');
            } catch (error: any) {
                expect(error.message).to.match(/timeout|aborted/i);
            }
        });

        it('应该处理 404 错误', async () => {
            nock('https://httpbin.nstarter')
                .get('/status/404')
                .reply(404);

            const client = new NsHttpClient({
                adapter: EClientAdapter.axios,
                security: {
                    enableDnsValidation: false
                },
                logging: { enabled: false }
            });

            const response = await client.get('https://httpbin.nstarter/status/404');
            expect(response.status).to.equal(404);
        });

        it('应该处理网络错误', async () => {
            nock('http://nonexistent-domain-12345.com')
                .get('/')
                .replyWithError({ code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND' });

            const client = new NsHttpClient({
                adapter: EClientAdapter.axios,
                security: {
                    enableDnsValidation: false
                },
                request: { timeout: 2000 }, // 设置2秒超时，防止测试超时
                logging: { enabled: false }
            });

            try {
                await client.get('http://nonexistent-domain-12345.com');
                expect.fail('Should have thrown network error');
            } catch (error: any) {
                expect(error.code).to.exist;
            }
        });
    });

    describe('Retry mechanism', () => {
        it('应该遵守最大重试次数', async () => {
            // 所有请求都返回 503
            nock('https://httpbin.nstarter')
                .get('/status/503')
                .times(4) // 初始请求 + 3次重试
                .reply(503);

            const client = new NsHttpClient({
                adapter: EClientAdapter.axios,
                security: {
                    enableDnsValidation: false
                },
                request: {
                    retries: 3,
                    retryDelay: 100
                },
                logging: { enabled: false }
            });

            const response = await client.get('https://httpbin.nstarter/status/503');
            // 重试3次后仍然失败
            expect(response.status).to.equal(503);
        });
    });

    describe('Different adapters', () => {
        it('应该与 axios 适配器一起工作', async () => {
            nock('https://httpbin.nstarter')
                .get('/get')
                .reply(200, { adapter: 'axios' });

            const client = new NsHttpClient({
                adapter: EClientAdapter.axios,
                security: {
                    enableDnsValidation: false
                },
                logging: { enabled: false }
            });

            const response = await client.get('https://httpbin.nstarter/get');
            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('adapter', 'axios');
        });

        it('应该与 undici 适配器一起工作', async () => {
            const mockPool = mockAgent.get('https://httpbin.nstarter');
            mockPool.intercept({
                path: '/get',
                method: 'GET'
            }).reply(200, { adapter: 'undici' });

            const client = new NsHttpClient({
                adapter: EClientAdapter.undici,
                security: {
                    enableDnsValidation: false
                },
                logging: { enabled: false }
            });

            const response = await client.get('https://httpbin.nstarter/get');
            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('adapter', 'undici');
        });
    });
});
