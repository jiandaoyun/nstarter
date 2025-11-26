/**
 * 集成测试
 * 注意：使用 nock 进行 HTTP mock，测试不同 adapter 和安全功能的集成
 */

import { expect } from 'chai';
import nock from 'nock';
import { HttpClient } from '../../src';
import { SecurityError } from '../../src';
import { EHttpRequestClientAdapter } from '../../src';

describe('HttpClient Integration Tests', function () {
    this.timeout(10000);

    afterEach(() => {
        nock.cleanAll();
    });

    describe('Basic HTTP requests', () => {
        it('should make a successful GET request with axios', async () => {
            nock('https://httpbin.org')
                .get('/get')
                .reply(200, {
                    args: {},
                    headers: {},
                    url: 'https://httpbin.org/get'
                });

            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.axios,
                logging: { enabled: false }
            });

            const response = await client.get('https://httpbin.org/get');
            expect(response.status).to.equal(200);
            expect(response.data).to.exist;
        });

        it('should make a successful GET request with undici', async () => {
            nock('https://httpbin.org')
                .get('/get')
                .reply(200, {
                    args: {},
                    headers: {},
                    url: 'https://httpbin.org/get'
                });

            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.undici,
                logging: { enabled: false }
            });

            const response = await client.get('https://httpbin.org/get');
            expect(response.status).to.equal(200);
            expect(response.data).to.exist;
        });

        it('should make a successful POST request', async () => {
            nock('https://httpbin.org')
                .post('/post', {
                    test: 'data'
                })
                .reply(200, {
                    json: { test: 'data' }
                });

            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.axios,
                logging: { enabled: false }
            });

            const response = await client.post('https://httpbin.org/post', {
                test: 'data'
            });
            expect(response.status).to.equal(200);
            expect(response.data).to.exist;
        });
    });

    describe('Security validations', () => {
        it('should block requests to loopback addresses', async () => {
            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.axios,
                security: {
                    enableIpValidation: true,
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

        it('should block requests to private IP addresses', async () => {
            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.axios,
                security: {
                    enableIpValidation: true,
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

        it('should allow requests to private IPs when enabled', async () => {
            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.axios,
                security: {
                    enableIpValidation: true,
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

        it('should enforce whitelist', async () => {
            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.axios,
                security: {
                    whitelist: ['httpbin.org']
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

        it('should enforce blacklist', async () => {
            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.axios,
                security: {
                    blacklist: ['bad.example.com']
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
        it('should handle timeout errors', async () => {
            nock('https://httpbin.org')
                .get('/delay/5')
                .delayConnection(5000)
                .reply(200);

            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.axios,
                request: { timeout: 100 }, // 100ms timeout
                logging: { enabled: false }
            });

            try {
                await client.get('https://httpbin.org/delay/5');
                expect.fail('Should have thrown timeout error');
            } catch (error: any) {
                expect(error.message).to.match(/timeout|aborted/i);
            }
        });

        it('should handle 404 errors', async () => {
            nock('https://httpbin.org')
                .get('/status/404')
                .reply(404);

            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.axios,
                logging: { enabled: false }
            });

            const response = await client.get('https://httpbin.org/status/404');
            expect(response.status).to.equal(404);
        });

        it('should handle network errors', async () => {
            nock('http://nonexistent-domain-12345.com')
                .get('/')
                .replyWithError({ code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND' });

            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.axios,
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
        it('should retry on temporary failures', async () => {
            // 第一次返回 503，第二次返回 200
            nock('https://httpbin.org')
                .get('/status/503')
                .reply(503)
                .get('/status/503')
                .reply(200, { success: true });

            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.axios,
                request: {
                    retries: 3,
                    retryDelay: 100
                },
                logging: { enabled: false }
            });

            const response = await client.get('https://httpbin.org/status/503');
            // 第一次失败后重试，第二次成功
            expect(response.status).to.equal(200);
        });

        it('should respect max retries', async () => {
            // 所有请求都返回 503
            nock('https://httpbin.org')
                .get('/status/503')
                .times(4) // 初始请求 + 3次重试
                .reply(503);

            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.axios,
                request: {
                    retries: 3,
                    retryDelay: 100
                },
                logging: { enabled: false }
            });

            const response = await client.get('https://httpbin.org/status/503');
            // 重试3次后仍然失败
            expect(response.status).to.equal(503);
        });
    });

    describe('Different adapters', () => {
        it('should work with axios adapter', async () => {
            nock('https://httpbin.org')
                .get('/get')
                .reply(200, { adapter: 'axios' });

            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.axios,
                logging: { enabled: false }
            });

            const response = await client.get('https://httpbin.org/get');
            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('adapter', 'axios');
        });

        it('should work with undici adapter', async () => {
            nock('https://httpbin.org')
                .get('/get')
                .reply(200, { adapter: 'undici' });

            const client = new HttpClient({
                adapter: EHttpRequestClientAdapter.undici,
                logging: { enabled: false }
            });

            const response = await client.get('https://httpbin.org/get');
            expect(response.status).to.equal(200);
            expect(response.data).to.have.property('adapter', 'undici');
        });
    });
});
