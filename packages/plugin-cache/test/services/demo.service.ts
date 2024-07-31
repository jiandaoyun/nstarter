import { cacheGet, cacheEvict, cacheKey, cachePut } from '../../src';
import { demoCacheManager } from '../caches/demo.cache';

let counter = 0;

/**
 * 默认缓存服务模拟
 */
export class DemoService {
    @cacheGet(demoCacheManager)
    public async getData(@cacheKey key: string) {
        return counter ++;
    }

    @cachePut(demoCacheManager)
    public async updateData(@cacheKey key: string, value: number) {
        counter = value;
        return value;
    }

    @cacheEvict(demoCacheManager)
    public async clearData(@cacheKey key: string) {
        counter = 0;
        return 0;
    }
}

export const demoService = new DemoService();
