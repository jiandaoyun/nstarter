import { getSvc, registerSvc } from 'nstarter-core';
import { TestService } from './test.service';

registerSvc(TestService);

export const testService = getSvc<TestService>(TestService);
