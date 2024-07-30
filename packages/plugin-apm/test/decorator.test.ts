import chai from 'chai';

import { sleep, SpanFunc, TransactionFunc } from './functions';

const should = chai.should();

const tests: (TransactionFunc | SpanFunc)[] = [
    new TransactionFunc(),
    new SpanFunc()
];

for (let test of tests) {
    describe(test.constructor.name, () => {
        it('normalFunc', async () => {
            try {
                const result = test.normalFunc();
                should.equal(result, 'normal');
            } catch (err) {
                should.not.exist(err);
            }
        });

        it('errorFunc', async () => {
            try {
                test.errorFunc();
            } catch (err) {
                should.exist(err);
                should.equal(err.message, 'error');
            }
        });

        it('promiseFunc', async () => {
            try {
                const result = await test.promiseFunc();
                should.equal(result, 'promise');
            } catch (err) {
                should.not.exist(err);
            }
        });

        it('promiseErrorFunc', async () => {
            try {
                await test.promiseErrorFunc();
            } catch (err) {
                should.exist(err);
                should.equal(err.message, 'error');
            }
        });

        it('asyncFunc', async () => {
            try {
                const result = await test.asyncFunc();
                should.equal(result, 'async');
            } catch (err) {
                should.not.exist(err);
            }
        });

        it('asyncErrorFunc', async () => {
            try {
                await test.asyncErrorFunc();
            } catch (err) {
                should.exist(err);
                should.equal(err.message, 'error');
            }
        });

        it('callbackFunc', (done) => {
            test.callbackFunc((err: any, result: any) => {
                should.not.exist(err);
                should.equal(result, 'callback');
                return done();
            });
        });

        it('callbackErrorFunc', (done) => {
            test.callbackErrorFunc((err: any) => {
                should.exist(err);
                return done();
            });
        });

        after(async () => {
            await sleep(100);
        });
    });
}
