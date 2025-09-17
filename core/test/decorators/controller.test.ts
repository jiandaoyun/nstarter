import chai from 'chai';

import { demoController } from '../example/controllers';
import { ContextProvider } from '../../src';

const should = chai.should();

describe('Controller', () => {
    it('ping', async () => {
        ContextProvider.startContext();
        const context = ContextProvider.getContext();

        const res = await demoController.doPing();

        context.traceId.should.equal('test_context');
    });

    it('error', async () => {
        try {
            const res = await demoController.goErrorView();
        } catch (err) {
            should.exist(err);
        }
    });
});
