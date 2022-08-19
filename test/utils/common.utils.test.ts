import { expect } from 'chai';

import NsUtils from '../../src';

describe('common utils', () => {
    it('randomString', async () => {
        expect(typeof NsUtils.randomString(8)).eq('string');
        expect(typeof NsUtils.randomString(8, '我能吞下玻璃而不伤身体')).eq('string');
        expect(typeof NsUtils.randomString(8, '🚀🚁🛶')).eq('string');
    });
});
