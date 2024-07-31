import { cacheGet, cacheEvict, cacheKey, cachePut } from '../../src';
import { errorCacheManager } from '../caches/error.cache';

let counter = 0;

/**
 * 异常缓存模拟
 */
export class ErrorService {
    @cacheGet(errorCacheManager)
    public async getData(@cacheKey key: string) {
        return counter ++;
    }

    @cachePut(errorCacheManager)
    public async updateData(@cacheKey key: string, value: number) {
        counter = value;
        return value;
    }

    @cacheEvict(errorCacheManager)
    public async clearData(@cacheKey key: string) {
        counter = 0;
        return 0;
    }
}

export const errorService = new ErrorService();
