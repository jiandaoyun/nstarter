import { cacheGet, cacheEvict, cacheKey, cachePut } from '../../src';
import { demoCacheManager } from '../caches/demo.cache';

let store: any;

/**
 * 空值缓存服务模拟
 */
export class EmptyService {
    @cacheGet(demoCacheManager)
    public async getData(@cacheKey key: string) {
        return store;
    }

    @cachePut(demoCacheManager)
    public async updateData(@cacheKey key: string, value: any) {
        store = value;
        return value;
    }

    @cacheEvict(demoCacheManager)
    public async clearData(@cacheKey key: string) {
        store = undefined;
        return store;
    }
}

export const emptyService = new EmptyService();
