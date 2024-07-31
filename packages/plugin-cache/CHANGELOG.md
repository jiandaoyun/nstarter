# Changelog

## 0.2.0

* 升级 nstarter 框架，适配 nstarter-core 1.0
* 升级基础包依赖

### Breaking
* 升级 Node.js 版本要求 >= 18.12.0
* 升级 typescript -> 4.9.5


## 0.1.3

* 提供装饰器扩展参数，允许扩展参数控制缓存 key 以及 ttl 规则，取代 `isKeyRequired` 判定逻辑

## 0.1.2 

* `CacheManager` 增加 `isKeyRequired` 属性，允许全局缓存对象不指定 cacheKey

## 0.1.1

* `_getCache` 类型签名支持 undefined 

## 0.1.0
