import 'reflect-metadata';
import { AbstractCacheManager } from './lib';
import { CACHE_ARG_META_PREFIX } from './constants';
import { ICacheOptions } from './types';

const getCacheArgMetaKey = (propertyKey: string) => `${ CACHE_ARG_META_PREFIX }:${ propertyKey }`;

/**
 * 从缓存读取数据或生成缓存
 * @description 方法装饰器
 * @param cache - 缓存管理器
 * @param options - 缓存读取配置
 */
export function cacheGet<T, K>(cache: AbstractCacheManager<T, K>, options?: ICacheOptions) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const func = descriptor.value;
        descriptor.value = async (...args: any[]) => {
            const keyArgIdx = Reflect.getMetadata(getCacheArgMetaKey(propertyKey), target);
            let keyArg: K | null = null;
            if (keyArgIdx >= 0) {
                keyArg = args[keyArgIdx];
            } else {
                if (!options?.key) {
                    throw new Error('cache key arguments is not defined');
                }
            }

            let content = await cache.getCache(keyArg as K, options);
            if (content !== undefined) {
                // 命中缓存
                return content;
            } else {
                // 未命中缓存
                content = await func.apply(target, args);
                if (content !== undefined) {
                    // 缓存有效内容
                    cache.putCache(keyArg as K, content, options).then();
                }
                return content;
            }
        };
    };
}

/**
 * 获取数据并强制更新缓存
 * @description 方法装饰器
 * @param cache - 缓存管理器
 * @param options - 缓存操作配置
 */
export function cachePut<T, K>(cache: AbstractCacheManager<T, K>, options?: ICacheOptions) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const func = descriptor.value;
        descriptor.value = async (...args: any[]) => {
            const keyArgIdx = Reflect.getMetadata(getCacheArgMetaKey(propertyKey), target);
            let keyArg: K | null = null;
            if (keyArgIdx >= 0) {
                keyArg = args[keyArgIdx];
            } else {
                if (!options?.key) {
                    throw new Error('cache key arguments is not defined');
                }
            }
            // 执行内容生成方法后更新缓存
            const content = await func.apply(target, args);
            if (content !== undefined) {
                cache.putCache(keyArg as K, content, options).then();
            }
            return content;
        };
    };
}

/**
 * 执行后清除缓存
 * @description 方法装饰器
 * @param cache - 缓存对象
 * @param options - 缓存操作配置
 */
export function cacheEvict<T, K>(cache: AbstractCacheManager<T, K>, options?: ICacheOptions) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const func = descriptor.value;
        descriptor.value = async (...args: any[]) => {
            const keyArgIdx = Reflect.getMetadata(getCacheArgMetaKey(propertyKey), target);
            let keyArg: K | null = null;
            if (keyArgIdx >= 0) {
                keyArg = args[keyArgIdx];
            } else {
                if (!options?.key) {
                    throw new Error('cache key arguments is not defined');
                }
            }
            // 执行方法后清理缓存
            const result = await func.apply(target, args);
            cache.evictCache(keyArg as K, options).then();
            return result;
        };
    };
}

/**
 * 标记缓存 key 生成参数
 * @description 参数装饰器
 */
export function cacheKey(target: any, propertyKey: string, parameterIndex: number) {
    Reflect.defineMetadata(getCacheArgMetaKey(propertyKey), parameterIndex, target);
}
