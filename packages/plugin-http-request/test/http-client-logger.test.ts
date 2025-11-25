/**
 * HTTP 客户端日志记录器测试
 */

import { expect } from 'chai';
import { HttpClientLogger } from '../src/logger/http-client-logger';
import { LogFilter } from '../src/logger/log-filter';
import type { ILogger, IResSuccessOptions, IResFailedOptions } from '../src/types';

describe('HttpClientLogger', () => {
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
    it('should log successful requests', () => {
      const mockLogger = new MockLogger();
      const httpLogger = new HttpClientLogger({
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

    it('should log failed requests', () => {
      const mockLogger = new MockLogger();
      const httpLogger = new HttpClientLogger({
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
    it('should log request body when enabled', () => {
      const mockLogger = new MockLogger();
      const httpLogger = new HttpClientLogger({
        logger: mockLogger,
        logRequestBody: true,
        logResponseBody: false
      });

      httpLogger.logSuccess(createSuccessOptions());

      expect(mockLogger.logs[0].meta.requestBody).to.exist;
    });

    it('should log response body when enabled', () => {
      const mockLogger = new MockLogger();
      const httpLogger = new HttpClientLogger({
        logger: mockLogger,
        logRequestBody: false,
        logResponseBody: true
      });

      httpLogger.logSuccess(createSuccessOptions());

      expect(mockLogger.logs[0].meta.responseBody).to.exist;
    });

    it('should truncate large bodies', () => {
      const mockLogger = new MockLogger();
      const httpLogger = new HttpClientLogger({
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
    it('should not log when filter returns false', () => {
      const mockLogger = new MockLogger();
      const filter = new LogFilter({ onlyFailed: true });
      const httpLogger = new HttpClientLogger({
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

    it('should log when filter returns true', () => {
      const mockLogger = new MockLogger();
      const filter = new LogFilter({ 
        methods: ['GET'],
        minDuration: 50
      });
      const httpLogger = new HttpClientLogger({
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
    it('should create logger with factory method', () => {
      const mockLogger = new MockLogger();
      const httpLogger = HttpClientLogger.create(
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

    it('should create logger without filter', () => {
      const mockLogger = new MockLogger();
      const httpLogger = HttpClientLogger.create(mockLogger);

      httpLogger.logSuccess(createSuccessOptions());
      httpLogger.logFailed(createFailedOptions());

      expect(mockLogger.logs).to.have.lengthOf(2);
    });
  });

  describe('Metadata handling', () => {
    it('should include scenario in metadata', () => {
      const mockLogger = new MockLogger();
      const httpLogger = new HttpClientLogger({ logger: mockLogger });

      httpLogger.logSuccess(createSuccessOptions({
        request: { method: 'GET', url: 'test', scenario: 'user-login' }
      }));

      expect(mockLogger.logs[0].meta.scenario).to.equal('user-login');
    });

    it('should include request metadata', () => {
      const mockLogger = new MockLogger();
      const httpLogger = new HttpClientLogger({ logger: mockLogger });

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

    it('should include retry count', () => {
      const mockLogger = new MockLogger();
      const httpLogger = new HttpClientLogger({ logger: mockLogger });

      httpLogger.logFailed(createFailedOptions({ retryCount: 3 }));

      expect(mockLogger.logs[0].meta.retryCount).to.equal(3);
    });
  });
});

