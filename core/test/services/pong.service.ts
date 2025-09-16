import type { PingService } from './ping.service';
import { injectService, service } from 'nstarter-core';

@service()
export class PongService {
    @injectService()
    private pingService: PingService;

    public pong() {
        console.log('pong');
    }

    public ping() {
        this.pingService.ping();
    }
}
