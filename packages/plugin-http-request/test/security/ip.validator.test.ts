/**
 * IP 验证器测试
 */

import { expect } from 'chai';
import { IpValidator } from '../../src';

describe('IpValidator', () => {
    describe('IPv4 validation', () => {
        it('应该拒绝回环地址', () => {
            const result = IpValidator.validate('127.0.0.1', false);
            expect(result.valid).to.be.false;
            expect(result.isLoopback).to.be.true;
            expect(result.reason).to.match(/loopback/i);
        });

        it('应该在不允许时拒绝私有 IP 地址', () => {
            const privateIps = ['10.0.0.1', '172.16.0.1', '192.168.1.1'];

            for (const ip of privateIps) {
                const result = IpValidator.validate(ip, false);
                expect(result.valid).to.be.false;
                expect(result.isPrivate).to.be.true;
                expect(result.reason).to.match(/private/i);
            }
        });

        it('应该在允许时接受私有 IP 地址', () => {
            const privateIps = ['10.0.0.1', '172.16.0.1', '192.168.1.1'];

            for (const ip of privateIps) {
                const result = IpValidator.validate(ip, true);
                expect(result.valid).to.be.true;
                expect(result.isPrivate).to.be.true;
            }
        });

        it('应该拒绝链路本地地址', () => {
            const result = IpValidator.validate('169.254.1.1', false);
            expect(result.valid).to.be.false;
            expect(result.isLinkLocal).to.be.true;
            expect(result.reason).to.match(/link-local/i);
        });

        it('应该拒绝多播地址', () => {
            const result = IpValidator.validate('224.0.0.1', false);
            expect(result.valid).to.be.false;
            expect(result.isMulticast).to.be.true;
            expect(result.reason).to.match(/multicast/i);
        });

        it('应该接受公共 IP 地址', () => {
            const publicIps = ['8.8.8.8', '1.1.1.1', '93.184.216.34'];

            for (const ip of publicIps) {
                const result = IpValidator.validate(ip, false);
                expect(result.valid).to.be.true;
                expect(result.isPrivate).to.be.false;
                expect(result.isLoopback).to.be.false;
            }
        });

        it('应该拒绝无效的 IP 地址', () => {
            const invalidIps = ['256.1.1.1', 'not-an-ip', '1.2.3'];

            for (const ip of invalidIps) {
                const result = IpValidator.validate(ip, false);
                expect(result.valid).to.be.false;
                expect(result.reason).to.match(/invalid/i);
            }
        });
    });

    describe('IPv6 validation', () => {
        it('应该拒绝回环地址', () => {
            const result = IpValidator.validate('::1', false);
            expect(result.valid).to.be.false;
            expect(result.isLoopback).to.be.true;
        });

        it('应该在不允许时拒绝私有 IPv6 地址', () => {
            const privateIps = ['fc00::1', 'fd00::1'];

            for (const ip of privateIps) {
                const result = IpValidator.validate(ip, false);
                expect(result.valid).to.be.false;
                expect(result.isPrivate).to.be.true;
            }
        });

        it('应该拒绝链路本地 IPv6 地址', () => {
            const result = IpValidator.validate('fe80::1', false);
            expect(result.valid).to.be.false;
            expect(result.isLinkLocal).to.be.true;
        });

        it('应该拒绝多播 IPv6 地址', () => {
            const result = IpValidator.validate('ff00::1', false);
            expect(result.valid).to.be.false;
            expect(result.isMulticast).to.be.true;
        });

        it('应该接受公共 IPv6 地址', () => {
            const publicIps = ['2001:4860:4860::8888', '2606:4700:4700::1111'];

            for (const ip of publicIps) {
                const result = IpValidator.validate(ip, false);
                expect(result.valid).to.be.true;
            }
        });
    });

    describe('Batch validation', () => {
        it('应该验证多个 IP', () => {
            const ips = ['8.8.8.8', '127.0.0.1', '192.168.1.1'];
            const results = IpValidator.validateMany(ips, false);

            expect(results).to.have.lengthOf(3);
            expect(results[0].valid).to.be.true;
            expect(results[1].valid).to.be.false;
            expect(results[2].valid).to.be.false;
        });

        it('应该检查所有 IP 是否有效', () => {
            const validIps = ['8.8.8.8', '1.1.1.1'];
            const invalidIps = ['8.8.8.8', '127.0.0.1'];

            expect(IpValidator.validateAll(validIps, false)).to.be.true;
            expect(IpValidator.validateAll(invalidIps, false)).to.be.false;
        });
    });
});

