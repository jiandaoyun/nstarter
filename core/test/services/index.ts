import { getSvc, registerSvc } from '../../src';

import { PingService } from './ping.service';
import { PongService } from './pong.service';


registerSvc(PingService);
registerSvc(PongService);

export const pingService = getSvc<PingService>(PingService);
export const pongService = getSvc<PongService>(PongService);
