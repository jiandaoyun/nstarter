import { AbstractCacheManager } from '../../src';

/**
 * 缓存异常模拟测试
 */
export class ErrorCacheManager extends AbstractCacheManager<any, string> {
    protected async _getCache(keyArg: string) {
        throw new Error('get cache error');
    }

    protected async _putCache(keyArg: string, content: string) {
        throw new Error('put cache error');
    }

    protected async _evictCache(keyArg: string) {
        throw new Error('evict cache error');
    }
}

export const errorCacheManager = new ErrorCacheManager();
