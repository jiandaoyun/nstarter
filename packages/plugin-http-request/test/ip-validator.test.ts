/**
 * IP 验证器测试
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { IpValidator } from '../src/security/ip-validator';

describe('IpValidator', () => {
  describe('IPv4 validation', () => {
    it('should reject loopback addresses', () => {
      const result = IpValidator.validate('127.0.0.1', false);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.isLoopback, true);
      assert.match(result.reason!, /loopback/i);
    });

    it('should reject private IP addresses when not allowed', () => {
      const privateIps = ['10.0.0.1', '172.16.0.1', '192.168.1.1'];
      
      for (const ip of privateIps) {
        const result = IpValidator.validate(ip, false);
        assert.strictEqual(result.valid, false);
        assert.strictEqual(result.isPrivate, true);
        assert.match(result.reason!, /private/i);
      }
    });

    it('should accept private IP addresses when allowed', () => {
      const privateIps = ['10.0.0.1', '172.16.0.1', '192.168.1.1'];
      
      for (const ip of privateIps) {
        const result = IpValidator.validate(ip, true);
        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.isPrivate, true);
      }
    });

    it('should reject link-local addresses', () => {
      const result = IpValidator.validate('169.254.1.1', false);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.isLinkLocal, true);
      assert.match(result.reason!, /link-local/i);
    });

    it('should reject multicast addresses', () => {
      const result = IpValidator.validate('224.0.0.1', false);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.isMulticast, true);
      assert.match(result.reason!, /multicast/i);
    });

    it('should accept public IP addresses', () => {
      const publicIps = ['8.8.8.8', '1.1.1.1', '93.184.216.34'];
      
      for (const ip of publicIps) {
        const result = IpValidator.validate(ip, false);
        assert.strictEqual(result.valid, true);
        assert.strictEqual(result.isPrivate, false);
        assert.strictEqual(result.isLoopback, false);
      }
    });

    it('should reject invalid IP addresses', () => {
      const invalidIps = ['256.1.1.1', 'not-an-ip', '1.2.3'];
      
      for (const ip of invalidIps) {
        const result = IpValidator.validate(ip, false);
        assert.strictEqual(result.valid, false);
        assert.match(result.reason!, /invalid/i);
      }
    });
  });

  describe('IPv6 validation', () => {
    it('should reject loopback addresses', () => {
      const result = IpValidator.validate('::1', false);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.isLoopback, true);
    });

    it('should reject private IPv6 addresses when not allowed', () => {
      const privateIps = ['fc00::1', 'fd00::1'];
      
      for (const ip of privateIps) {
        const result = IpValidator.validate(ip, false);
        assert.strictEqual(result.valid, false);
        assert.strictEqual(result.isPrivate, true);
      }
    });

    it('should reject link-local IPv6 addresses', () => {
      const result = IpValidator.validate('fe80::1', false);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.isLinkLocal, true);
    });

    it('should reject multicast IPv6 addresses', () => {
      const result = IpValidator.validate('ff00::1', false);
      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.isMulticast, true);
    });

    it('should accept public IPv6 addresses', () => {
      const publicIps = ['2001:4860:4860::8888', '2606:4700:4700::1111'];
      
      for (const ip of publicIps) {
        const result = IpValidator.validate(ip, false);
        assert.strictEqual(result.valid, true);
      }
    });
  });

  describe('Batch validation', () => {
    it('should validate multiple IPs', () => {
      const ips = ['8.8.8.8', '127.0.0.1', '192.168.1.1'];
      const results = IpValidator.validateMany(ips, false);
      
      assert.strictEqual(results.length, 3);
      assert.strictEqual(results[0].valid, true);
      assert.strictEqual(results[1].valid, false);
      assert.strictEqual(results[2].valid, false);
    });

    it('should check if all IPs are valid', () => {
      const validIps = ['8.8.8.8', '1.1.1.1'];
      const invalidIps = ['8.8.8.8', '127.0.0.1'];
      
      assert.strictEqual(IpValidator.validateAll(validIps, false), true);
      assert.strictEqual(IpValidator.validateAll(invalidIps, false), false);
    });
  });
});

