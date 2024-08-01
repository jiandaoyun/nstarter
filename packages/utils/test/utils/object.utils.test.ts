/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author Henry.Zeng
 * @date 2023/4/6
 */
import { expect } from 'chai';
import NsUtils from '../../src';

describe('object utils', () => {
    it('defaults', () => {
        const desObj = {
            a: 1,
            b: 2
        };
        const defaults1 = NsUtils.defaults(desObj, { b:3, c: 4 });
        expect(desObj).deep.eq(defaults1);
        expect({ a: 1, b: 2, c: 4 }).deep.eq(desObj);

        const defaults2 = NsUtils.defaults(null, { a:1 });
        expect({ a: 1 }).deep.eq(defaults2);

        const defaults3 = NsUtils.defaults({ a:1 }, null);
        expect({ a: 1 }).deep.eq(defaults3);

        const defaults4 = NsUtils.defaults(null, null);
        expect({}).deep.eq(defaults4);
    });

    it('set', () => {
        const value = { a: 1, b: { c: 2 } };
        const res1 = NsUtils.set(value, 'd', 3);
        expect(res1).deep.eq(value);
        expect(res1).deep.eq({ a: 1, b: { c: 2 }, d: 3});

        const res2 = NsUtils.set({ a: 1 }, ['e'], 4);
        expect(res2).deep.eq({ a: 1, e: 4 });

        const res3 = NsUtils.set({ a: 1 }, ['f', 'g'], 5);
        expect(res3).deep.eq({ a: 1, f: { g: 5 } });

        const res4 = NsUtils.set({ a: 1, b: { c: 2 } }, ['b'], 6);
        expect(res4).deep.eq({ a: 1, b: 6});

        const res5 = NsUtils.set({ a: 1, f: { g: 5 } }, ['f', 'h'], 7);
        expect(res5).deep.eq({ a: 1, f: { g: 5, h: 7 } });

        const res6 = NsUtils.set({ a: 1, f: [1, 2, 3] }, ['f', 'h'], 7);
        const f = [1, 2, 3];
        // @ts-ignore
        f['h'] = 7;
        expect(res6).deep.eq({ a: 1, f });
    });
});
