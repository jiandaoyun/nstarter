import chai from 'chai';
import { emptyService } from './services/empty.service';
import { demoCacheStore } from './caches/demo.cache';
import { demoService } from './services/demo.service';

const expect = chai.expect;

describe('Empty Value Cache Test', () => {
    const cacheKey = 'test';
    before(async () => {
        // 初始值
        demoCacheStore[cacheKey] = 0;
    });

    it('cache undefined', async () => {
        const result = await emptyService.updateData(cacheKey, undefined);
        expect(result).to.be.undefined;
        expect(demoCacheStore[cacheKey]).to.equal(0);
        let value = await demoService.getData(cacheKey);
        // undefined 为无效缓存
        expect(value).not.to.be.undefined;
    });

    it('cache null', async () => {
        const result = await emptyService.updateData(cacheKey, null);
        expect(result).to.be.null;
        expect(demoCacheStore[cacheKey]).to.equal(null);
        const value = await demoService.getData(cacheKey);
        expect(value).to.be.null;
    });

    it('cache 0', async () => {
        const result = await emptyService.updateData(cacheKey, 0);
        expect(result).to.equal(0);
        expect(demoCacheStore[cacheKey]).to.equal(0);
        const value = await demoService.getData(cacheKey);
        expect(value).to.equal(0);
    });

    it('cache NaN', async () => {
        const result = await emptyService.updateData(cacheKey, NaN);
        expect(result).is.NaN;
        expect(demoCacheStore[cacheKey]).is.NaN;
        const value = await demoService.getData(cacheKey);
        expect(value).is.NaN;
    });

    it('cache Infinity', async () => {
        const result = await emptyService.updateData(cacheKey, Infinity);
        expect(result).to.equal(Infinity);
        expect(demoCacheStore[cacheKey]).to.equal(Infinity);
        const value = await demoService.getData(cacheKey);
        expect(value).to.equal(Infinity);
    });

    it('cache ""', async () => {
        const result = await emptyService.updateData(cacheKey, "");
        expect(result).to.equal("");
        expect(demoCacheStore[cacheKey]).to.equal("");
        const value = await demoService.getData(cacheKey);
        expect(value).to.equal("");
    });

    it('cache false', async () => {
        const result = await emptyService.updateData(cacheKey, false);
        expect(result).to.equal(false);
        expect(demoCacheStore[cacheKey]).to.equal(false);
        const value = await demoService.getData(cacheKey);
        expect(value).to.equal(false);
    });
});
