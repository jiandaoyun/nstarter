import { apmSpan, apmTransaction } from '../src';

export const sleep = async (timeMs: number) => {
    return new Promise((r) => setTimeout(r, timeMs));
}

const loop = () => {
    let sum = 0 ;
    for (let i = 0; i < 100000000; i++) {
        sum += i;
    }
}

export class TransactionFunc {
    @apmTransaction()
    public normalFunc() {
        loop();
        return 'normal';
    }

    @apmTransaction()
    public errorFunc() {
        loop();
        throw new Error('error');
    }

    @apmTransaction('promiseTask', {
        labels: {
            message: 'trace message'
        }
    })
    public promiseFunc() {
        return new Promise((resolve) =>
            setTimeout(() => {
                resolve('promise')
            }, 100)
        );
    }

    @apmTransaction()
    public promiseErrorFunc() {
        return new Promise((resolve, reject) =>
            setTimeout(() => {
                reject(new Error('error'))
            }, 100)
        );
    }

    @apmTransaction()
    public async asyncFunc() {
        await sleep(100);
        return 'async';
    }

    @apmTransaction()
    public async asyncErrorFunc() {
        await sleep(100);
        throw new Error('error');
    }

    @apmTransaction()
    public callbackFunc(callback: Function) {
        setTimeout(() => callback(null, 'callback'), 100);
    }

    @apmTransaction()
    public callbackErrorFunc(callback: Function) {
        setTimeout(() => callback(new Error('error')), 100);
    }

    @apmTransaction()
    public async asyncWithSpan() {
        const spanTest = new SpanFunc();
        return await spanTest.asyncFunc();
    }
}


export class SpanFunc {
    @apmSpan()
    public normalFunc() {
        loop();
        return 'normal';
    }

    @apmSpan()
    public errorFunc() {
        loop();
        throw new Error('error');
    }

    @apmSpan()
    public promiseFunc() {
        return new Promise((resolve) =>
            setTimeout(() => {
                resolve('promise')
            }, 100)
        );
    }

    @apmSpan()
    public promiseErrorFunc() {
        return new Promise((resolve, reject) =>
            setTimeout(() => {
                reject(new Error('error'))
            }, 100)
        );
    }

    @apmSpan('asyncTask', {
        labels: {
            message: 'trace message'
        }
    })
    public async asyncFunc() {
        await sleep(100);
        return 'async';
    }

    @apmSpan()
    public async asyncErrorFunc() {
        await sleep(100);
        throw new Error('error');
    }

    @apmSpan()
    public callbackFunc(callback: Function) {
        setTimeout(() => callback(null, 'callback'), 100);
    }

    @apmSpan()
    public callbackErrorFunc(callback: Function) {
        setTimeout(() => callback(new Error('error')), 100);
    }
}
