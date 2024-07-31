import { AbstractCacheManager } from '../../src';

/**
 * 内存缓存存储模拟
 */
export const demoCacheStore: Record<string, any> = {};

/**
 * 默认示例缓存
 */
export class DemoCacheManager extends AbstractCacheManager<any, string> {
    protected async _getCache(keyArg: string) {
        return demoCacheStore[this._getCacheKey(keyArg)];
    }

    protected async _putCache(keyArg: string, content: string) {
        demoCacheStore[this._getCacheKey(keyArg)] = content;
    }

    protected async _evictCache(keyArg: string) {
        delete demoCacheStore[this._getCacheKey(keyArg)];
    }

    protected _getCacheKey(keyArg: string) {
        return keyArg;
    }
}

export const demoCacheManager = new DemoCacheManager();
