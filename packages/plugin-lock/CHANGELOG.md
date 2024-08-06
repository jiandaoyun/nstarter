## 更新日志

### 2024

* 0.3.0:
  * 环境依赖升级
    - 运行时环境 Node.js >= 20.16.0
    - TypeScript -> 5.x
  * 组件升级
    - ioredis - 5.4.0
    - redis-semaphore -> 5.6.0
      > changelog: https://github.com/swarthy/redis-semaphore/releases/tag/v5.6.0
  * 开发环境依赖
    - @typescript-eslint/* -> 7.17.0
  * 支持 `commonJs` + `esModule`


### 2023

* 0.2.x:
  * 升级依赖 `redis-semaphore` 到 5.5.0, 适配相关特性, 修正了从 5.3.x - 5.5.0 差异中的系列问题:
    * Added `identifier` constructor option.
    * Added `acquiredExternally` constructor option.
    * Option `externallyAcquiredIdentifier` **DEPRECATED**.
    * Option `identifierSuffix` **DEPRECATED**.
    * Fixed reacquire expired resource in refresh
  * 由于 [Issue 193](https://github.com/swarthy/redis-semaphore/issues/193), 移除了锁重入场景的相关特性.
  * 优化测试用例写法.

### 2022

* 0.1.x: 项目初始化.
