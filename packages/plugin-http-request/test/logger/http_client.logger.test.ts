import { expect } from 'chai';
import * as sinon from 'sinon';
import { NsHttpClientLogger } from '../../src';
import type { ILogger } from '../../src';

describe('NsHttpClientLogger', () => {
    const createLogger = () => {
        const info = sinon.spy();
        const error = sinon.spy();
        const logger: ILogger = {
            debug: sinon.spy(),
            info,
            warn: sinon.spy(),
            error
        };
        return { logger, info, error };
    };

    afterEach(() => {
        sinon.restore();
    });

    it('应该在过滤器拒绝时跳过日志', () => {
        const { logger, info, error } = createLogger();
        const filter = { shouldLog: () => false };
        const clientLogger = new NsHttpClientLogger({
            logger,
            filter,
            logRequestBody: true,
            logResponseBody: true
        });

        clientLogger.logSuccess({
            request: { method: 'GET', url: 'https://api.test' },
            response: { status: 200, statusText: 'OK', data: 'ok', headers: {}, config: {} as any },
            duration: 10,
            retryCount: 0
        });
        clientLogger.logFailed({
            request: { method: 'POST', url: 'https://api.test' },
            error: new Error('boom'),
            errorCode: 'ERR',
            duration: 5,
            retryCount: 1
        });

        expect(info.called).to.be.false;
        expect(error.called).to.be.false;
    });

    it('logSuccess 应记录流式完成的指标', () => {
        const { logger, info } = createLogger();
        const clientLogger = new NsHttpClientLogger({
            logger,
            logResponseBody: true,
            bodyMaxLength: 5
        });

        clientLogger.logSuccess({
            request: {
                method: 'GET',
                url: 'https://api.test/stream',
                meta: { traceId: 't1' },
                scenario: 'scene'
            },
            response: { status: 200, statusText: 'OK', data: 'very-long-body', headers: {}, config: {} as any },
            duration: 150,
            retryCount: 0,
            streamMetrics: {
                ttfb: 50,
                completed: true,
                totalDuration: 200,
                bytesTransferred: 2048
            }
        });

        expect(info.calledOnce).to.be.true;
        const meta = info.firstCall.args[1];
        expect(meta.responseBody).to.equal('# --- stream (completed) --- #');
        expect(meta.streamMetrics.throughput).to.include('KB/s');
        expect(meta.streamMetrics.bytesTransferredHuman).to.include('KB');
    });

    it('logSuccess 流式未完成时应标记 in progress', () => {
        const { logger, info } = createLogger();
        const clientLogger = new NsHttpClientLogger({
            logger,
            logResponseBody: true
        });

        clientLogger.logSuccess({
            request: { method: 'GET', url: 'https://api.test/streaming' },
            response: { status: 200, statusText: 'OK', data: '', headers: {}, config: {} as any },
            duration: 20,
            retryCount: 0,
            streamMetrics: {
                ttfb: 10,
                completed: false
            }
        });

        const meta = info.firstCall.args[1];
        expect(meta.responseBody).to.equal('# --- stream (in progress) --- #');
    });

    it('logFailed 应记录请求/响应体并截断特殊类型', () => {
        const { logger, error } = createLogger();
        const clientLogger = new NsHttpClientLogger({
            logger,
            logRequestBody: true
        });

        clientLogger.logFailed({
            request: { method: 'POST', url: 'https://api.test/fail', body: Buffer.from('abc') },
            error: new Error('fail'),
            errorCode: 'E_FAIL',
            duration: 30,
            retryCount: 1,
            status: 500,
            response: {
                status: 500,
                statusText: 'ERR',
                data: Buffer.from('resp'),
                headers: {},
                config: {} as any
            }
        });

        expect(error.calledOnce).to.be.true;
        const meta = error.firstCall.args[1];
        expect(meta.requestBody).to.equal('# --- buffer (3 bytes) --- #');
        expect(meta.responseBody).to.equal('# --- buffer (4 bytes) --- #');
        expect(meta.status).to.equal(500);
    });

    it('truncateBody 应处理 arraybuffer / null / undefined / stream', () => {
        const { logger } = createLogger();
        const clientLogger = new NsHttpClientLogger({ logger, logRequestBody: true });
        const instance: any = clientLogger;
        const arr = new ArrayBuffer(8);
        const stream = {
            pipe: () => {
            }
        };

        expect(instance.truncateBody(arr)).to.equal('# --- arraybuffer (8 bytes) --- #');
        expect(instance.truncateBody(null)).to.equal('# --- null --- #');
        expect(instance.truncateBody(undefined)).to.equal('# --- undefined --- #');
        expect(instance.truncateBody(stream)).to.equal('# --- stream --- #');
    });

    it('formatBytes 应处理 0 Bytes', () => {
        const { logger } = createLogger();
        const clientLogger = new NsHttpClientLogger({ logger, logRequestBody: true });
        const instance: any = clientLogger;

        expect(instance['formatBytes'](0)).to.equal('0 Bytes');
    });

    it('truncateBody 应处理 Blob 标记', () => {
        const { logger } = createLogger();
        const clientLogger = new NsHttpClientLogger({ logger, logRequestBody: true });
        const instance: any = clientLogger;
        const fakeBlob = { size: 5, constructor: { name: 'Blob' } } as any;

        expect(instance.truncateBody(fakeBlob)).to.equal('# --- blob (5 bytes) --- #');
    });

    it('buildLogMeta 应计算 streamDuration', () => {
        const { logger, info } = createLogger();
        const clientLogger = new NsHttpClientLogger({
            logger,
            logResponseBody: true
        });

        clientLogger.logSuccess({
            request: { method: 'GET', url: 'https://api.test/stream' },
            response: { status: 200, statusText: 'OK', data: 'ok', headers: {}, config: {} as any },
            duration: 120,
            retryCount: 0,
            streamMetrics: {
                ttfb: 20,
                completed: true,
                totalDuration: 120,
                bytesTransferred: 1024
            }
        });

        const meta = info.firstCall.args[1];
        expect(meta.streamMetrics.streamDuration).to.equal(100);
        expect(meta.responseBody).to.equal('# --- stream (completed) --- #');
    });

    it('buildLogMeta 应处理完成但无 bytesTransferred 的流', () => {
        const { logger, info } = createLogger();
        const clientLogger = new NsHttpClientLogger({ logger, logResponseBody: true });

        clientLogger.logSuccess({
            request: { method: 'GET', url: 'https://api.test/stream2' },
            response: { status: 200, statusText: 'OK', data: 'ok', headers: {}, config: {} as any },
            duration: 50,
            retryCount: 0,
            streamMetrics: {
                ttfb: 10,
                completed: true,
                totalDuration: 50
            }
        });

        const meta = info.firstCall.args[1];
        expect(meta.streamMetrics.streamDuration).to.equal(40);
        expect(meta.responseBody).to.equal('# --- stream (completed) --- #');
    });

    it('buildLogMeta 直接调用应计算 streamDuration', () => {
        const { logger } = createLogger();
        const clientLogger = new NsHttpClientLogger({ logger, logResponseBody: true });
        const meta = (clientLogger as any).buildLogMeta({
            isSuccess: true,
            request: { method: 'GET', url: 'https://api.test' },
            response: { status: 200, statusText: 'OK', data: 'd', headers: {}, config: {} as any },
            duration: 80,
            retryCount: 0,
            timestamp: Date.now(),
            streamMetrics: {
                ttfb: 10,
                completed: true,
                totalDuration: 80
            }
        });

        expect(meta.streamMetrics.streamDuration).to.equal(70);
    });

    it('create 应返回带过滤器的新实例', () => {
        const { logger } = createLogger();
        const clientLogger = NsHttpClientLogger.create(logger, { statusCodes: [500] }, { logRequestBody: true });

        expect(clientLogger).to.be.instanceOf(NsHttpClientLogger);
    });

    it('truncateBody 应直接返回短字符串', () => {
        const { logger } = createLogger();
        const clientLogger = new NsHttpClientLogger({ logger, logRequestBody: true });
        const instance: any = clientLogger;

        expect(instance.truncateBody('short')).to.equal('short');
    });

    it('truncateBody 对小对象返回原对象', () => {
        const { logger } = createLogger();
        const clientLogger = new NsHttpClientLogger({ logger, logRequestBody: true });
        const instance: any = clientLogger;
        const obj = { a: 1 };

        expect(instance.truncateBody(obj)).to.equal(obj);
    });

    it('truncateBody 应返回数值和布尔', () => {
        const { logger } = createLogger();
        const clientLogger = new NsHttpClientLogger({ logger, logRequestBody: true });
        const instance: any = clientLogger;

        expect(instance.truncateBody(42)).to.equal(42);
        expect(instance.truncateBody(true)).to.equal(true);
    });

    it('truncateBody 应截断过大的对象', () => {
        const { logger } = createLogger();
        const clientLogger = new NsHttpClientLogger({ logger, logRequestBody: true, bodyMaxLength: 10 });
        const instance: any = clientLogger;
        const obj = { a: 'very-long-value' };

        const result = instance.truncateBody(obj);
        expect(result).to.be.a('string');
        expect(result).to.include('(truncated)');
    });

    it('truncateBody 无法序列化时返回占位符', () => {
        const { logger } = createLogger();
        const clientLogger = new NsHttpClientLogger({ logger, logRequestBody: true });
        const instance: any = clientLogger;
        const circular: any = { name: 'test' };
        circular.self = circular;

        expect(instance.truncateBody(circular)).to.equal('[unable to serialize body]');
    });
});
