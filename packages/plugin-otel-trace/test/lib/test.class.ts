import { sleep } from 'nstarter-utils';
import { span } from '../../src';


export class TestClass {
    @span()
    public func() {
        console.log('run -> TestClass::func');
    }

    @span()
    public async asyncFunc(){
        await sleep(100);
        console.log('run -> TestClass::asyncFunc');
    }

    @span('TestClass::callback', {
        traceCallback: true
    })
    public callbackFunc(callback: Callback) {
        console.log('run -> TestClass::callbackFunc');
        callback();
    }

    @span()
    public callbackFuncWithoutTrace(callback: Callback) {
        console.log('run -> TestClass::callbackFunc');
        callback();
    }
}
