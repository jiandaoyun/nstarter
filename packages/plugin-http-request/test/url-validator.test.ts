/**
 * URL 验证器测试
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { UrlValidator } from '../src/security/url-validator';

describe('UrlValidator', () => {
  describe('Basic validation', () => {
    it('should accept valid HTTP URLs', () => {
      const validator = new UrlValidator();
      const result = validator.validate('http://example.com');
      assert.strictEqual(result.valid, true);
    });

    it('should accept valid HTTPS URLs', () => {
      const validator = new UrlValidator();
      const result = validator.validate('https://example.com');
      assert.strictEqual(result.valid, true);
    });

    it('should reject invalid URLs', () => {
      const validator = new UrlValidator();
      const result = validator.validate('not-a-url');
      assert.strictEqual(result.valid, false);
      assert.match(result.reason!, /invalid url/i);
    });

    it('should reject non-HTTP protocols', () => {
      const validator = new UrlValidator();
      const protocols = ['ftp://example.com', 'file:///etc/passwd', 'gopher://example.com'];
      
      for (const url of protocols) {
        const result = validator.validate(url);
        assert.strictEqual(result.valid, false);
        assert.match(result.reason!, /protocol/i);
      }
    });
  });

  describe('Whitelist validation', () => {
    it('should accept URLs in whitelist', () => {
      const validator = new UrlValidator(['example.com']);
      const result = validator.validate('https://example.com/path');
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.inWhitelist, true);
    });

    it('should reject URLs not in whitelist', () => {
      const validator = new UrlValidator(['example.com']);
      const result = validator.validate('https://other.com');
      assert.strictEqual(result.valid, false);
      assert.match(result.reason!, /not in whitelist/i);
    });

    it('should support wildcard patterns', () => {
      const validator = new UrlValidator(['*.example.com']);
      
      assert.strictEqual(validator.validate('https://api.example.com').valid, true);
      assert.strictEqual(validator.validate('https://www.example.com').valid, true);
      assert.strictEqual(validator.validate('https://example.com').valid, true);
      assert.strictEqual(validator.validate('https://other.com').valid, false);
    });
  });

  describe('Blacklist validation', () => {
    it('should reject URLs in blacklist', () => {
      const validator = new UrlValidator([], ['bad.com']);
      const result = validator.validate('https://bad.com');
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.inBlacklist, true);
      assert.match(result.reason!, /blacklist/i);
    });

    it('should accept URLs not in blacklist', () => {
      const validator = new UrlValidator([], ['bad.com']);
      const result = validator.validate('https://good.com');
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.inBlacklist, false);
    });

    it('should support wildcard patterns in blacklist', () => {
      const validator = new UrlValidator([], ['*.bad.com']);
      
      assert.strictEqual(validator.validate('https://api.bad.com').valid, false);
      assert.strictEqual(validator.validate('https://bad.com').valid, false);
      assert.strictEqual(validator.validate('https://good.com').valid, true);
    });
  });

  describe('Whitelist priority', () => {
    it('should prioritize whitelist over blacklist', () => {
      const validator = new UrlValidator(['example.com'], ['*.example.com']);
      const result = validator.validate('https://example.com');
      assert.strictEqual(result.valid, true);
    });
  });

  describe('Dynamic list management', () => {
    it('should allow adding to whitelist', () => {
      const validator = new UrlValidator();
      validator.addToWhitelist('example.com');
      
      const result = validator.validate('https://example.com');
      assert.strictEqual(result.valid, true);
    });

    it('should allow removing from whitelist', () => {
      const validator = new UrlValidator(['example.com']);
      validator.removeFromWhitelist('example.com');
      
      const result = validator.validate('https://example.com');
      assert.strictEqual(result.valid, true); // No whitelist, so allowed
    });

    it('should allow clearing lists', () => {
      const validator = new UrlValidator(['example.com'], ['bad.com']);
      validator.clearWhitelist();
      validator.clearBlacklist();
      
      assert.strictEqual(validator.getWhitelist().length, 0);
      assert.strictEqual(validator.getBlacklist().length, 0);
    });
  });
});

