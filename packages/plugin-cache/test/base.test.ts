import chai from 'chai';
import { demoService } from './services/demo.service';
import { demoCacheStore } from './caches/demo.cache';

const expect = chai.expect;

describe('Base Cache Test', () => {
    const cacheKey = 'test';

    it('get cache miss', async () => {
        const value = await demoService.getData(cacheKey);
        expect(value).to.equal(0);
        expect(demoCacheStore[cacheKey]).to.equal(0);
    });

    it('get cache hit', async () => {
        const value = await demoService.getData(cacheKey);
        expect(value).to.equal(0);
        expect(demoCacheStore[cacheKey]).to.equal(0);
    });

    it('put cache', async () => {
        const result = await demoService.updateData(cacheKey, 3);
        expect(result).to.equal(3);
        expect(demoCacheStore[cacheKey]).to.equal(3);
        const value = await demoService.getData(cacheKey);
        expect(value).to.equal(3);
        expect(demoCacheStore[cacheKey]).to.equal(3);
    });

    it('evict cache', async () => {
        const result = await demoService.clearData(cacheKey);
        expect(result).to.equal(0);
        expect(demoCacheStore[cacheKey]).to.be.undefined;
        const value = await demoService.getData(cacheKey);
        expect(value).to.equal(0);
    });
});
