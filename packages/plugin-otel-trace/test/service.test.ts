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

    it('errorFunc', async () => {
        try {
            await testService.errorFunc();
        } catch (err) {
            should.exist(err);
            err.message.should.equals('Test Error');
        }
    });

    it('callbackErrorFunc', (done) => {
        try {
            testService.callbackErrorFunc((err: Error) => {
                should.exist(err);
                err.message.should.equals('Test Error');
                done();
            });
        } catch (err) {
            should.not.exist(err);
        }
    });
});
