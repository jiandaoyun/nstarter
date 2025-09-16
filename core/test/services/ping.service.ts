import type { PongService } from './pong.service';
import { injectService, service } from 'nstarter-core';
import { foo } from 'ns-module';
import { sleep } from 'nstarter-utils';

@service()
export class PingService {
    @injectService()
    private pongService: PongService;

    public async ping() {
        console.log('ping');
        await sleep(100);
    }

    public pong () {
        this.pongService.pong();
    }

    public moduleFoo() {
        console.log(foo());
    }
}
