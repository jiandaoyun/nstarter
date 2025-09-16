import type { PongService } from './pong.service';
import { injectService, service } from '../../src';

@service()
export class PingService {
    @injectService()
    private pongService: PongService;

    public async ping() {
        console.log('ping');
    }

    public pong () {
        this.pongService.pong();
    }
}
