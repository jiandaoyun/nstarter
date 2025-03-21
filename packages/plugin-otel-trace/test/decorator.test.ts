import chai from 'chai';

import { TestClass } from './lib/test.class';

const should = chai.should();
const testClass = new TestClass();

describe('Span decorator test', () => {
    it('func', async () => {
        testClass.func();
    });

    it('asyncFunc', async () => {
        await testClass.asyncFunc();
    });

    it('callbackFunc', (done) => {
        testClass.callbackFunc(() => {
            done();
        });
    });

    it('callbackFuncWithoutTrace', (done) => {
        testClass.callbackFuncWithoutTrace(() => {
            done();
        });
    });
});
