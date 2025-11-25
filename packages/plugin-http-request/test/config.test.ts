/**
 * 配置管理测试
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { mergeConfig, validateConfig } from '../src/config';

describe('Config', () => {
  describe('mergeConfig', () => {
    it('should use default config when no user config provided', () => {
      const config = mergeConfig();
      assert.strictEqual(config.adapter, 'axios');
      assert.strictEqual(config.security.enableDnsValidation, true);
      assert.strictEqual(config.security.enableIpValidation, true);
      assert.strictEqual(config.security.allowPrivateIp, false);
    });

    it('should merge user config with defaults', () => {
      const config = mergeConfig({
        adapter: 'undici',
        security: {
          allowPrivateIp: true
        }
      });
      
      assert.strictEqual(config.adapter, 'undici');
      assert.strictEqual(config.security.allowPrivateIp, true);
      assert.strictEqual(config.security.enableDnsValidation, true); // default
    });

    it('should preserve nested config', () => {
      const config = mergeConfig({
        security: {
          whitelist: ['example.com'],
          blacklist: ['bad.com']
        }
      });
      
      assert.deepStrictEqual(config.security.whitelist, ['example.com']);
      assert.deepStrictEqual(config.security.blacklist, ['bad.com']);
    });
  });

  describe('validateConfig', () => {
    it('should accept valid config', () => {
      const config = mergeConfig();
      assert.doesNotThrow(() => validateConfig(config));
    });

    it('should reject invalid adapter', () => {
      const config = mergeConfig({ adapter: 'invalid' as any });
      assert.throws(() => validateConfig(config), /invalid adapter/i);
    });

    it('should reject negative timeout', () => {
      const config = mergeConfig({ request: { timeout: -1 } as any });
      assert.throws(() => validateConfig(config), /timeout/i);
    });

    it('should reject negative retries', () => {
      const config = mergeConfig({ request: { retries: -1 } as any });
      assert.throws(() => validateConfig(config), /retries/i);
    });

    it('should reject negative DNS cache TTL', () => {
      const config = mergeConfig({ security: { dnsCacheTtl: -1 } });
      assert.throws(() => validateConfig(config), /dns cache ttl/i);
    });
  });
});

