import { service } from 'nstarter-core';
import { sleep } from 'nstarter-utils';

@service()
export class TestService {
    public func() {
        console.log('run -> TestService::func');
    }

    public async asyncFunc(){
        await sleep(100);
        console.log('run -> TestService::asyncFunc');
    }

    public async callbackFunc(callback: Callback) {
        console.log('run -> TestService::callbackFunc');
        callback();
    }
}
