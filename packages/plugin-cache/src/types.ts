/**
 * 缓存事件
 */
export enum CacheEvents {
    // 命中统计事件
    hit = 'hit',
    miss = 'miss',
    // 操作事件
    put = 'put',
    get = 'get',
    evict = 'evict',
    // 缓存操作失败
    error = 'error'
}

/**
 * 缓存操作配置参数
 */
export interface ICacheOptions {
    key?: string;
    ttl?: number;
}
