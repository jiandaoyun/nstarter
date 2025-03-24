import { service, injectService } from 'nstarter-core';
import { sleep } from 'nstarter-utils';
import type { RefService } from './ref.service';

@service()
export class TestService {
    private _name = 'test';

    @injectService()
    private refService: RefService;

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

    public async errorFunc() {
        console.log('run -> TestService::errorFunc');
        throw new Error('Test Error');
    }

    public callbackErrorFunc(callback: Callback) {
        console.log('run -> TestService::callbackErrorFunc');
        const error = new Error('Test Error');
        callback(error);
    }
}
