import { expect } from 'chai';

import NsUtils from '../../src';
import { isSafeInteger } from '../../src/utils/number.utils';

describe('number utils', () => {
    it('isSafeInteger', async () => {
        expect(NsUtils.isSafeInteger(5)).eq(true);
        // @ts-ignore
        expect(NsUtils.isSafeInteger('5')).eq(false);
        expect(NsUtils.isSafeInteger(Number.MIN_VALUE)).eq(false);
        expect(NsUtils.isSafeInteger(Infinity)).eq(false);
    });
});
