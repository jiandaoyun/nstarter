import chai from 'chai';

import { testService } from './lib/services';

const should = chai.should();

describe('Service Function Trace', () => {
    it('func', async () => {
        testService.func();
    });

    it('asyncFunc', async () => {
        await testService.asyncFunc();
    });

    it('callbackFunc', (done) => {
        testService.callbackFunc(() => {
            done();
        });
    });
});
