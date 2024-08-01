---
title: "nstarter-cache"
---

# nstarter-cache

`nstarter-cache`

注意：
* `nstarter-cache` 提供的缓存方法依赖装饰器环境，使用前需要确认已开启装饰器支持。

## 安装

使用 npm 进行安装

```bash
npm install -S nstarter-cache
```

## 使用说明

首先，由 CacheManager 统一规定缓存管理器的基础封装形式。在一般情况下，仅需要简单扩展缓存的 「存」,「取」,「删」方法，即可实现基础的缓存管理对象封装。特殊场景下，可以将诸如 redis lua 脚本等复杂存储业务访问逻辑，封装至缓存管理对象中。另外，对于缓存的 key 生成规则，缓存生命周期策略等，均可以直接在 CacheManager 对象上作为扩展属性灵活定义。

```typescript
import { AbstractCacheManager } from 'nstarter-cache';

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
```

在实际使用过程中，提供 `@cacheGet`, `@cachePut`, `@cacheEvict` 三个方法装饰器，通过与 CacheManager 对象组合，分别实现对于业务方法调用过程的 “带缓存读取”，“缓存强制更新”，“缓存删除” 逻辑。同时，额外提供一个参数装饰器 `@cacheKey`，用于标记调用方法中的缓存 key 生成参数。cacheKey 标记的调用方法入参并不限定仅支持 string 类型，允许为任意类型，并由 CacheManager 中的 _getCacheKey 方法处理。

```typescript
import { cacheGet, cacheEvict, cacheKey, cachePut } from 'nstarter-cache';

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
```

复杂业务情况情况下，允许直接在业务方法中调用 CacheManager 对象，直接操作相关缓存方法。


---
