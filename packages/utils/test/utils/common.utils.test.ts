import { expect } from 'chai';

import NsUtils  from '../../src';

describe('common utils', () => {
    it('randomString', async () => {
        expect(typeof NsUtils.randomString(8)).eq('string');
        expect(typeof NsUtils.randomString(8, '我能吞下玻璃而不伤身体')).eq('string');
        expect(typeof NsUtils.randomString(8, '🚀🚁🛶')).eq('string');
    });

    it('isString', async () => {
        expect(NsUtils.isString('')).eq(true);
        expect(NsUtils.isString(1)).eq(false);
        expect(NsUtils.isString(null)).eq(false);
    });
    const noop = function noop() {

    };
    it('isObjectLike', async () => {
        expect(NsUtils.isObjectLike('')).eq(false);
        expect(NsUtils.isObjectLike(1)).eq(false);
        expect(NsUtils.isObjectLike(null)).eq(false);
        expect(NsUtils.isObjectLike({})).eq(true);
        expect(NsUtils.isObjectLike(new Set())).eq(true);
        expect(NsUtils.isObjectLike(noop)).eq(false);
        expect(NsUtils.isObjectLike([1, 2, 3])).eq(true);
    });

    it('isObject', async () => {
        expect(NsUtils.isObject('')).eq(false);
        expect(NsUtils.isObject(1)).eq(false);
        expect(NsUtils.isObject(null)).eq(false);
        expect(NsUtils.isObject({})).eq(true);
        expect(NsUtils.isObject(new Set())).eq(true);
        expect(NsUtils.isObject(noop)).eq(true);
        expect(NsUtils.isObject([1, 2, 3])).eq(true);
    });

    it('isNumber', async () => {
        expect(NsUtils.isNumber('')).eq(false);
        expect(NsUtils.isNumber(1)).eq(true);
        expect(NsUtils.isNumber('1')).eq(false);
        expect(NsUtils.isNumber({})).eq(false);
        expect(NsUtils.isNumber(Number(12))).eq(true);
        expect(NsUtils.isNumber(new Number(12))).eq(true);
    });

    it('isPlainObject', async () => {
        expect(NsUtils.isPlainObject({})).eq(true);
        expect(NsUtils.isPlainObject([1, 2, 3])).eq(false);
        expect(NsUtils.isPlainObject(noop)).eq(false);
        expect(NsUtils.isPlainObject(new Set())).eq(false);
        expect(NsUtils.isPlainObject('12')).eq(false);
        expect(NsUtils.isPlainObject(Number(12))).eq(false);
        expect(NsUtils.isPlainObject(new Number(12))).eq(false);
        expect(NsUtils.isPlainObject(Object.create(null))).eq(true);
    });

    it('isMobileUA', () => {
        expect(NsUtils.isMobileUA('Android')).eq(true);
        expect(NsUtils.isMobileUA('Mac OS')).eq(false);
        expect(NsUtils.isMobileUA('Fuchsia')).eq(false);
        expect(NsUtils.isMobileUA('Mozilla/5.0 (Phone; OpenHarmony 5.0)')).eq(true);
        // @ts-ignore 错误类型检查
        expect(NsUtils.isMobileUA(null)).eq(false);
        // @ts-ignore 错误类型检查
        expect(NsUtils.isMobileUA(undefined)).eq(false);
    });
});
