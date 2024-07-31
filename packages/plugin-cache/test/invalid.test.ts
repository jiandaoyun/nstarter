import chai from 'chai';
import { invalidService } from './services/invalid.service';

const expect = chai.expect;

describe('Invalid Cache Test', () => {

    it('get cache', async () => {
        try {
            await invalidService.getData();
        } catch (err) {
            expect(err).to.exist;
        }
    });

    it('put cache', async () => {
        try {
            await invalidService.updateData(3);
        } catch (err) {
            expect(err).to.exist;
        }
    });


    it('evict cache', async () => {
        try {
            await invalidService.clearData();
        } catch (err) {
            expect(err).to.exist;
        }
    });
});
