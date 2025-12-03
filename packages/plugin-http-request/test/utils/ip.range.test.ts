/**
 * IP 范围工具测试
 */

import { expect } from 'chai';
import {
    ipv4ToNumber,
    ipv6ToBigInt,
    normalizeIpv6,
    compileIpv4Range,
    compileIpv6Range,
    isIpv4InCompiledRange,
    isIpv6InCompiledRange,
    compileIpv4Ranges,
    compileIpv6Ranges,
    isIpv4InAnyCompiledRange,
    isIpv6InAnyCompiledRange
} from '../../src/utils/ip.range';

describe('IP Range Utils', () => {
    describe('ipv4ToNumber', () => {
        it('应该正确转换 IPv4 地址为数字', () => {
            expect(ipv4ToNumber('0.0.0.0')).to.equal(0);
            expect(ipv4ToNumber('255.255.255.255')).to.equal(4294967295);
            expect(ipv4ToNumber('192.168.1.1')).to.equal(3232235777);
            expect(ipv4ToNumber('10.0.0.1')).to.equal(167772161);
            expect(ipv4ToNumber('127.0.0.1')).to.equal(2130706433);
        });

        it('应该正确处理边界值', () => {
            expect(ipv4ToNumber('0.0.0.1')).to.equal(1);
            expect(ipv4ToNumber('1.0.0.0')).to.equal(16777216);
            expect(ipv4ToNumber('255.0.0.0')).to.equal(4278190080);
        });
    });


    describe('normalizeIpv6', () => {
        it('应该正确展开 IPv6 缩写', () => {
            expect(normalizeIpv6('::1')).to.equal('0000:0000:0000:0000:0000:0000:0000:0001');
            // 注意：IPv4 映射的 IPv6 地址不会被转换，但会展开 ::
            // 实际输出可能保留 IPv4 部分或者将其转换
            // 根据实际函数行为调整
            expect(normalizeIpv6('2001:db8::1')).to.equal('2001:0db8:0000:0000:0000:0000:0000:0001');
            expect(normalizeIpv6('fe80::')).to.equal('fe80:0000:0000:0000:0000:0000:0000:0000');
        });

        it('应该处理完整的 IPv6 地址', () => {
            const fullAddress = '2001:0db8:0000:0000:0000:0000:0000:0001';
            expect(normalizeIpv6(fullAddress)).to.equal(fullAddress);
        });

        it('应该移除区域 ID', () => {
            expect(normalizeIpv6('fe80::1%eth0')).to.equal('fe80:0000:0000:0000:0000:0000:0000:0001');
            expect(normalizeIpv6('fe80::1%lo')).to.equal('fe80:0000:0000:0000:0000:0000:0000:0001');
        });

        it('应该处理中间的双冒号', () => {
            // IPv6 地址必须有8个组，:: 会填充缺失的0组
            expect(normalizeIpv6('2001:db8::8a2e:370:7334')).to.equal('2001:0db8:0000:0000:0000:8a2e:0370:7334');
        });

        it('应该处理只有双冒号的地址', () => {
            expect(normalizeIpv6('::')).to.equal('0000:0000:0000:0000:0000:0000:0000:0000');
        });
    });

    describe('ipv6ToBigInt', () => {
        it('应该正确转换 IPv6 地址为 BigInt', () => {
            const [high, low] = ipv6ToBigInt('::1');
            expect(high).to.equal(BigInt(0));
            expect(low).to.equal(BigInt(1));
        });

        it('应该正确处理完整的 IPv6 地址', () => {
            const [high, low] = ipv6ToBigInt('2001:db8::1');
            expect(high).to.be.a('bigint');
            expect(low).to.be.a('bigint');
        });

        it('应该处理全零地址', () => {
            const [high, low] = ipv6ToBigInt('::');
            expect(high).to.equal(BigInt(0));
            expect(low).to.equal(BigInt(0));
        });

        it('应该处理全一地址', () => {
            const [high, low] = ipv6ToBigInt('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
            expect(high).to.equal(BigInt('0xffffffffffffffff'));
            expect(low).to.equal(BigInt('0xffffffffffffffff'));
        });
    });



    describe('边界情况和错误处理', () => {
        it('应该正确处理大数运算', () => {
            // IPv4 最大值
            const maxIpv4 = '255.255.255.255';
            expect(ipv4ToNumber(maxIpv4)).to.equal(4294967295);

            // IPv6 大数
            const [high, low] = ipv6ToBigInt('ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
            expect(high).to.be.a('bigint');
            expect(low).to.be.a('bigint');
        });
    });

    describe('预编译 IPv4 范围', () => {
        it('应该正确预编译 IPv4 CIDR 范围', () => {
            const compiled = compileIpv4Range('192.168.0.0/16');
            
            expect(compiled).to.have.property('network');
            expect(compiled).to.have.property('mask');
            expect(compiled).to.have.property('cidr', '192.168.0.0/16');
            expect(compiled.network).to.be.a('number');
            expect(compiled.mask).to.be.a('number');
        });

        it('应该正确检查 IPv4 地址是否在预编译范围内', () => {
            const compiled = compileIpv4Range('192.168.0.0/16');
            
            // 在范围内
            expect(isIpv4InCompiledRange('192.168.0.1', compiled)).to.be.true;
            expect(isIpv4InCompiledRange('192.168.255.255', compiled)).to.be.true;
            
            // 不在范围内
            expect(isIpv4InCompiledRange('192.169.0.1', compiled)).to.be.false;
            expect(isIpv4InCompiledRange('10.0.0.1', compiled)).to.be.false;
        });

        it('应该处理 /32 单个 IP 地址', () => {
            const compiled = compileIpv4Range('192.168.1.1/32');
            expect(isIpv4InCompiledRange('192.168.1.1', compiled)).to.be.true;
            expect(isIpv4InCompiledRange('192.168.1.2', compiled)).to.be.false;
        });

        it('应该抛出错误当 CIDR 前缀无效时', () => {
            expect(() => compileIpv4Range('192.168.0.0/33')).to.throw('Invalid CIDR prefix');
            expect(() => compileIpv4Range('192.168.0.0/-1')).to.throw('Invalid CIDR prefix');
        });

        it('应该正确处理批量预编译', () => {
            const cidrs = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
            const compiled = compileIpv4Ranges(cidrs);

            expect(compiled).to.have.lengthOf(3);
            expect(compiled[0].cidr).to.equal('10.0.0.0/8');
            expect(compiled[1].cidr).to.equal('172.16.0.0/12');
            expect(compiled[2].cidr).to.equal('192.168.0.0/16');
        });

        it('应该正确检查IP是否在任一预编译范围内', () => {
            const ranges = compileIpv4Ranges(['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16']);

            expect(isIpv4InAnyCompiledRange('10.5.5.5', ranges)).to.be.true;
            expect(isIpv4InAnyCompiledRange('172.20.0.1', ranges)).to.be.true;
            expect(isIpv4InAnyCompiledRange('192.168.1.1', ranges)).to.be.true;
            expect(isIpv4InAnyCompiledRange('8.8.8.8', ranges)).to.be.false;
        });
    });

    describe('预编译 IPv6 范围', () => {
        it('应该正确预编译 IPv6 CIDR 范围', () => {
            const compiled = compileIpv6Range('2001:db8::/32');
            
            expect(compiled).to.have.property('networkHigh');
            expect(compiled).to.have.property('networkLow');
            expect(compiled).to.have.property('maskHigh');
            expect(compiled).to.have.property('maskLow');
            expect(compiled).to.have.property('prefix', 32);
            expect(compiled).to.have.property('cidr', '2001:db8::/32');
        });

        it('应该正确检查 IPv6 地址是否在预编译范围内', () => {
            const compiled = compileIpv6Range('fe80::/10');
            
            // 在范围内
            expect(isIpv6InCompiledRange('fe80::1', compiled)).to.be.true;
            expect(isIpv6InCompiledRange('fe80::ffff:ffff:ffff:ffff', compiled)).to.be.true;
            
            // 不在范围内
            expect(isIpv6InCompiledRange('fec0::1', compiled)).to.be.false;
            expect(isIpv6InCompiledRange('2001:db8::1', compiled)).to.be.false;
        });

        it('应该处理 /128 单个 IP 地址', () => {
            const compiled = compileIpv6Range('2001:db8::1/128');
            expect(isIpv6InCompiledRange('2001:db8::1', compiled)).to.be.true;
            expect(isIpv6InCompiledRange('2001:db8::2', compiled)).to.be.false;
        });

        it('应该正确处理大于64位的前缀', () => {
            const compiled = compileIpv6Range('2001:db8::/96');
            
            expect(compiled.prefix).to.equal(96);
            expect(compiled.maskHigh).to.equal(BigInt('0xffffffffffffffff'));
            
            // 测试检查
            expect(isIpv6InCompiledRange('2001:db8::1:0', compiled)).to.be.true;
            expect(isIpv6InCompiledRange('2001:db8::1:ffff', compiled)).to.be.true;
        });

        it('应该抛出错误当 CIDR 前缀无效时', () => {
            expect(() => compileIpv6Range('2001:db8::/129')).to.throw('Invalid IPv6 CIDR prefix');
            expect(() => compileIpv6Range('2001:db8::/-1')).to.throw('Invalid IPv6 CIDR prefix');
        });

        it('应该正确处理批量预编译', () => {
            const cidrs = ['fe80::/10', 'fc00::/7', '2001:db8::/32'];
            const compiled = compileIpv6Ranges(cidrs);

            expect(compiled).to.have.lengthOf(3);
            expect(compiled[0].cidr).to.equal('fe80::/10');
            expect(compiled[1].cidr).to.equal('fc00::/7');
            expect(compiled[2].cidr).to.equal('2001:db8::/32');
        });

        it('应该正确检查IP是否在任一预编译范围内', () => {
            const ranges = compileIpv6Ranges(['fe80::/10', 'fc00::/7', '2001:db8::/32']);

            expect(isIpv6InAnyCompiledRange('fe80::1', ranges)).to.be.true;
            expect(isIpv6InAnyCompiledRange('fc00::1', ranges)).to.be.true;
            expect(isIpv6InAnyCompiledRange('2001:db8::1', ranges)).to.be.true;
            expect(isIpv6InAnyCompiledRange('2001:4860::8888', ranges)).to.be.false;
        });
    });

});

