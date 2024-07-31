import { EventEmitter } from 'events';
import { CacheEvents, ICacheOptions } from '../types';

/**
 * 缓存事件定义
 */
export declare interface AbstractCacheManager<T, K> {
    on: ((event: CacheEvents, listener: () => void) => this) |
        /**
         * @param err - 异常
         * @param event - 缓存执行事件
         */
        ((event: CacheEvents.error, listener: (err: Error, event: CacheEvents) => void) => this);
}

/**
 * 抽象缓存对象定义
 */
export abstract class AbstractCacheManager<T, K> extends EventEmitter {
    /**
     * 缓存内容读取方法
     * @param keyArg - 缓存 key 生成参数
     * @param options - 缓存读取配置
     * @protected
     */
    protected abstract _getCache(keyArg: K, options?: ICacheOptions): Promise<T | undefined>;

    /**
     * 缓存内容写入方法
     * @param keyArg - 缓存 key 生成参数
     * @param content - 缓存内容
     * @param options - 缓存读取配置
     * @protected
     */
    protected abstract _putCache(keyArg: K, content: T, options?: ICacheOptions): Promise<void>;

    /**
     * 缓存清理方法
     * @param keyArg - 缓存 key 生成参数
     * @param options - 缓存读取配置
     * @protected
     */
    protected abstract _evictCache(keyArg: K, options?: ICacheOptions): Promise<void>;

    /**
     * 缓存 key 生成方法
     * @param keyArg - 缓存 key 生成参数
     * @protected
     */
    protected _getCacheKey(keyArg: K) {};

    /**
     * 读取缓存
     * @param keyArg - 缓存 key 生成参数
     * @param options - 缓存读取配置
     */
    public async getCache(keyArg: K, options?: ICacheOptions): Promise<T | undefined> {
        let content;
        try {
            this.emit(CacheEvents.get);
            content = await this._getCache(keyArg, options);
        } catch (err) {
            this.emit(CacheEvents.error, [err, CacheEvents.get]);
        } finally {
            if (content !== undefined) {
                // 缓存命中
                this.emit(CacheEvents.hit);
            } else {
                // 未命中缓存
                this.emit(CacheEvents.miss);
            }
        }
        return content;
    };

    /**
     * 写入缓存
     * @param keyArg - 缓存 key 生成参数
     * @param content - 缓存内容
     * @param options - 缓存操作配置
     */
    public async putCache(keyArg: K, content: T, options?: ICacheOptions): Promise<void> {
        try {
            this.emit(CacheEvents.put);
            return await this._putCache(keyArg, content, options);
        } catch (err) {
            this.emit(CacheEvents.error, [err, CacheEvents.put]);
        }
    };

    /**
     * 清除缓存
     * @param keyArg - 缓存 key 生成参数
     * @param options - 缓存操作配置
     */
    public async evictCache(keyArg: K, options?: ICacheOptions): Promise<void> {
        try {
            this.emit(CacheEvents.evict);
            return await this._evictCache(keyArg, options);
        } catch (err) {
            this.emit(CacheEvents.error, [err, CacheEvents.evict]);
        }
    };
}
