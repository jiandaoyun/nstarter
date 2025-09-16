import type { PingService } from './ping.service';
import { injectService, service } from '../../src';

@service()
export class PongService {
    @injectService()
    private pingService: PingService;

    public pong() {
        console.log('pong');
    }

    public async ping() {
        await this.pingService.ping();
    }
}
