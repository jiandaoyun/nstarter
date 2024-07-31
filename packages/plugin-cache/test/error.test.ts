import chai from 'chai';
import { errorService } from './services/error.service';
import { errorCacheManager } from './caches/error.cache';
import { CacheEvents } from '../src';

const expect = chai.expect;

describe('Error Cache Test', () => {
    const cacheKey = 'test';

    before(async () => {
        errorCacheManager.on(CacheEvents.error, () => {});
    });

    it('get cache', async () => {
        const value = await errorService.getData(cacheKey);
        expect(value).to.equal(0);
    });

    it('put cache', async () => {
        const result = await errorService.updateData(cacheKey, 3);
        expect(result).to.equal(3);
        const value = await errorService.getData(cacheKey);
        expect(value).to.equal(3);
    });


    it('evict cache', async () => {
        const result = await errorService.clearData(cacheKey);
        expect(result).to.equal(0);
        const value = await errorService.getData(cacheKey);
        expect(value).to.equal(0);
    });
});
