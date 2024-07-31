import chai from 'chai';

import { sleep, TransactionFunc } from './functions';

const should = chai.should();

describe('Nested Trace', () => {
    const trans = new TransactionFunc();

    it('nested', async () => {
        try {
            const result = await trans.asyncWithSpan();
            should.equal(result, 'async');
        } catch (err) {
            should.not.exist(err);
        }
    });

    after(async() => {
        await sleep(200);
    });
});
