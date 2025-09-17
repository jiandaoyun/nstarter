import chai from 'chai';
import { barComponent, fooComponent } from '../example/components';

const should = chai.should();

describe('Component', () => {
    it('foo.getStatus()', async () => {
        fooComponent.getStatus().should.equal('not_ready');

        await fooComponent.init();
        fooComponent.getStatus().should.equal('ready');

        await fooComponent.shutdown();
        fooComponent.getStatus().should.equal('not_ready');
    });

    it('bar.getStatus()', async () => {
        barComponent.getStatus().should.equal('not_ready');

        await barComponent.init();
        barComponent.getStatus().should.equal('not_ready');
    });
});
