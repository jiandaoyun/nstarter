import chai from 'chai';
import { pingService, pongService } from '../services';

const should = chai.should();

describe('Circular Call', () => {
    it('PingPong', async () => {
        try {
            await pingService.ping();
            pingService.pong();

            await pongService.ping();
            pongService.pong();
        } catch (err) {
            should.not.exist(err);
        }
    });
});
