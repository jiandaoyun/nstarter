import { cacheGet, cacheEvict, cachePut } from '../../src';
import { demoCacheManager } from '../caches/demo.cache';

let counter = 0;

/**
 * 无效缓存操作测试
 * @desc 未指定缓存 key 生成参数
 */
export class InvalidService {
    @cacheGet(demoCacheManager)
    public async getData() {
        return counter ++;
    }

    @cachePut(demoCacheManager)
    public async updateData(value: number) {
        counter = value;
        return value;
    }

    @cacheEvict(demoCacheManager)
    public async clearData() {
        counter = 0;
        return 0;
    }
}

export const invalidService = new InvalidService();
