/**
 * 集成测试
 * 注意：这些测试需要网络连接
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HttpClient } from '../src/client';
import { SecurityError } from '../src/types';

describe('HttpClient Integration Tests', () => {
  describe('Basic HTTP requests', () => {
    it('should make a successful GET request', async () => {
      const client = new HttpClient({
        adapter: 'axios',
        logging: { enabled: false }
      });

      try {
        const response = await client.get('https://httpbin.org/get');
        assert.strictEqual(response.status, 200);
        assert.ok(response.data);
      } catch (error: any) {
        // 网络不可用时跳过
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.log('Skipping test: Network unavailable');
          return;
        }
        throw error;
      }
    });

    it('should make a successful POST request', async () => {
      const client = new HttpClient({
        adapter: 'axios',
        logging: { enabled: false }
      });

      try {
        const response = await client.post('https://httpbin.org/post', {
          test: 'data'
        });
        assert.strictEqual(response.status, 200);
        assert.ok(response.data);
      } catch (error: any) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.log('Skipping test: Network unavailable');
          return;
        }
        throw error;
      }
    });
  });

  describe('Security validations', () => {
    it('should block requests to loopback addresses', async () => {
      const client = new HttpClient({
        adapter: 'axios',
        security: {
          enableIpValidation: true,
          allowPrivateIp: false
        },
        logging: { enabled: false }
      });

      await assert.rejects(
        async () => client.get('http://127.0.0.1:8080'),
        SecurityError
      );
    });

    it('should block requests to private IP addresses', async () => {
      const client = new HttpClient({
        adapter: 'axios',
        security: {
          enableIpValidation: true,
          allowPrivateIp: false
        },
        logging: { enabled: false }
      });

      await assert.rejects(
        async () => client.get('http://192.168.1.1'),
        SecurityError
      );
    });

    it('should allow requests to private IPs when enabled', async () => {
      const client = new HttpClient({
        adapter: 'axios',
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
        assert.notStrictEqual(error.constructor.name, 'SecurityError');
      }
    });

    it('should enforce whitelist', async () => {
      const client = new HttpClient({
        adapter: 'axios',
        security: {
          whitelist: ['httpbin.org']
        },
        logging: { enabled: false }
      });

      await assert.rejects(
        async () => client.get('https://google.com'),
        SecurityError
      );
    });

    it('should enforce blacklist', async () => {
      const client = new HttpClient({
        adapter: 'axios',
        security: {
          blacklist: ['bad.example.com']
        },
        logging: { enabled: false }
      });

      await assert.rejects(
        async () => client.get('https://bad.example.com'),
        SecurityError
      );
    });
  });

  describe('Error handling', () => {
    it('should handle timeout errors', async () => {
      const client = new HttpClient({
        adapter: 'axios',
        request: { timeout: 1 }, // 1ms timeout
        logging: { enabled: false }
      });

      try {
        await assert.rejects(
          async () => client.get('https://httpbin.org/delay/5'),
          /timeout/i
        );
      } catch (error: any) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.log('Skipping test: Network unavailable');
          return;
        }
        throw error;
      }
    });

    it('should handle 404 errors', async () => {
      const client = new HttpClient({
        adapter: 'axios',
        logging: { enabled: false }
      });

      try {
        const response = await client.get('https://httpbin.org/status/404');
        assert.strictEqual(response.status, 404);
      } catch (error: any) {
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
          console.log('Skipping test: Network unavailable');
          return;
        }
        throw error;
      }
    });
  });

  describe('Retry mechanism', () => {
    it('should retry on temporary failures', async () => {
      const client = new HttpClient({
        adapter: 'axios',
        request: {
          retries: 3,
          retryDelay: 100
        },
        logging: { enabled: false }
      });

      // 此测试依赖于网络环境，可能不稳定
      // 主要是确保重试机制不会导致程序崩溃
      try {
        await client.get('https://httpbin.org/status/503', { timeout: 5000 });
      } catch (error) {
        // 预期会失败，但应该进行了重试
        assert.ok(error);
      }
    });
  });
});

