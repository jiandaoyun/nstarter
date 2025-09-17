import chai from 'chai';
import { testComponent } from '../example/components';

const should = chai.should();

describe('Component Call', () => {
    it('getStatus', async () => {
        testComponent.getStatus().should.equal('not_ready');

        await testComponent.init();
        testComponent.getStatus().should.equal('ready');

        await testComponent.shutdown();
        testComponent.getStatus().should.equal('not_ready');
    });
});
