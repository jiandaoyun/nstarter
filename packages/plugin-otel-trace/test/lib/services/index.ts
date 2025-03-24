import { getSvc, registerSvc } from 'nstarter-core';
import { TestService } from './test.service';
import { RefService } from './ref.service';

registerSvc(TestService);
registerSvc(RefService);

export const testService = getSvc<TestService>(TestService);
export const refService = getSvc<RefService>(RefService);
