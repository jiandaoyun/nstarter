/**
 * URL 验证器测试
 */

import { expect } from 'chai';
import { UrlValidator } from '../src';

describe('UrlValidator', () => {
    describe('Basic validation', () => {
        it('should accept valid HTTP URLs', () => {
            const validator = new UrlValidator();
            const result = validator.validate('http://example.com');
            expect(result.valid).to.be.true;
        });

        it('should accept valid HTTPS URLs', () => {
            const validator = new UrlValidator();
            const result = validator.validate('https://example.com');
            expect(result.valid).to.be.true;
        });

        it('should reject invalid URLs', () => {
            const validator = new UrlValidator();
            const result = validator.validate('not-a-url');
            expect(result.valid).to.be.false;
            expect(result.reason).to.match(/invalid url/i);
        });

        it('should reject non-HTTP protocols', () => {
            const validator = new UrlValidator();
            const protocols = ['ftp://example.com', 'file:///etc/passwd', 'gopher://example.com'];

            for (const url of protocols) {
                const result = validator.validate(url);
                expect(result.valid).to.be.false;
                expect(result.reason).to.match(/protocol/i);
            }
        });
    });

    describe('Whitelist validation', () => {
        it('should accept URLs in whitelist', () => {
            const validator = new UrlValidator(['example.com']);
            const result = validator.validate('https://example.com/path');
            expect(result.valid).to.be.true;
            expect(result.inWhitelist).to.be.true;
        });

        it('should reject URLs not in whitelist', () => {
            const validator = new UrlValidator(['example.com']);
            const result = validator.validate('https://other.com');
            expect(result.valid).to.be.false;
            expect(result.reason).to.match(/not in whitelist/i);
        });

        it('should support wildcard patterns', () => {
            const validator = new UrlValidator(['*.example.com']);

            expect(validator.validate('https://api.example.com').valid).to.be.true;
            expect(validator.validate('https://www.example.com').valid).to.be.true;
            expect(validator.validate('https://example.com').valid).to.be.true;
            expect(validator.validate('https://other.com').valid).to.be.false;
        });
    });

    describe('Blacklist validation', () => {
        it('should reject URLs in blacklist', () => {
            const validator = new UrlValidator([], ['bad.com']);
            const result = validator.validate('https://bad.com');
            expect(result.valid).to.be.false;
            expect(result.inBlacklist).to.be.true;
            expect(result.reason).to.match(/blacklist/i);
        });

        it('should accept URLs not in blacklist', () => {
            const validator = new UrlValidator([], ['bad.com']);
            const result = validator.validate('https://good.com');
            expect(result.valid).to.be.true;
            expect(result.inBlacklist).to.be.false;
        });

        it('should support wildcard patterns in blacklist', () => {
            const validator = new UrlValidator([], ['*.bad.com']);

            expect(validator.validate('https://api.bad.com').valid).to.be.false;
            expect(validator.validate('https://bad.com').valid).to.be.false;
            expect(validator.validate('https://good.com').valid).to.be.true;
        });
    });

    describe('Whitelist priority', () => {
        it('should prioritize whitelist over blacklist', () => {
            const validator = new UrlValidator(['example.com'], ['*.example.com']);
            const result = validator.validate('https://example.com');
            expect(result.valid).to.be.true;
        });
    });

    describe('Dynamic list management', () => {
        it('should allow adding to whitelist', () => {
            const validator = new UrlValidator();
            validator.addToWhitelist('example.com');

            const result = validator.validate('https://example.com');
            expect(result.valid).to.be.true;
        });

        it('should allow removing from whitelist', () => {
            const validator = new UrlValidator(['example.com']);
            validator.removeFromWhitelist('example.com');

            const result = validator.validate('https://example.com');
            expect(result.valid).to.be.true; // No whitelist, so allowed
        });

        it('should allow clearing lists', () => {
            const validator = new UrlValidator(['example.com'], ['bad.com']);
            validator.clearWhitelist();
            validator.clearBlacklist();

            expect(validator.getWhitelist()).to.have.lengthOf(0);
            expect(validator.getBlacklist()).to.have.lengthOf(0);
        });
    });
});

