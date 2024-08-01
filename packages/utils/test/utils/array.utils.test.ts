import { expect } from 'chai';

import NsUtils  from '../../src';

describe('array utils', () => {
    it('last', async () => {
        expect(NsUtils.last([1, 2, 3])).eq(3);
        expect(NsUtils.last([])).eq(undefined);
        expect(NsUtils.last()).eq(undefined);
    });

    it('head', async () => {
        expect(NsUtils.head([1, 2, 3])).eq(1);
        expect(NsUtils.head([])).eq(undefined);
        expect(NsUtils.head()).eq(undefined);
    });

    it('shift', async () => {
        const array = [1, 2, 3];
        expect(NsUtils.shift(array)).eq(1);
        expect(array).deep.eq([2, 3]);
        expect(NsUtils.shift([])).eq(undefined);
        expect(NsUtils.shift()).eq(undefined);
    });

    it('arrayEach', async () => {
        const eachArray: number[] = [];
        const array = await NsUtils.arrayEach(
            [1, 2, 3],
            async (value) => {
                await NsUtils.sleep(value * 10);
                eachArray.push(value);
                return value !== 2;
            }
        );
        expect(array).deep.eq([1, 2, 3]);
        expect(eachArray).deep.eq([1, 2]);
    });

    it('arrayFilter', () => {
        const arr: number[] = [1, 2, 3];
        const array = NsUtils.arrayFilter(
            arr,
            (value) => {
                return value !== 2;
            }
        );
        expect(array).deep.eq([1, 3]);
    });

    it('arrayIncludes', () => {
        const arr: number[] = [1, 2, 3];
        const hasValue = NsUtils.arrayIncludes(arr, 2);
        const hasValue2 = NsUtils.arrayIncludes(arr, 4);
        expect(hasValue).eq(true);
        expect(hasValue2).eq(false);
    });

    it('arrayMap', () => {
        const arr: number[] = [1, 2, 3];
        const vals1 = NsUtils.arrayMap(arr, (value => { return value * 2 }));
        const vals2 = NsUtils.arrayMap(arr, (value => { return 'a' + value }));
        expect([2, 4, 6]).deep.eq(vals1);
        expect(['a1', 'a2', 'a3']).deep.eq(vals2);
    });
});
