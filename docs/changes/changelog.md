---
title: "变更记录"
---

## 2024-08

![nstarter-core](https://img.shields.io/badge/nstarter--core-v1%2E2%2E0-orange?logo=npm&style=flat)

* 基础框架组件升级
    - 升级 Node.js 版本要求 >= 20.16.0
    - 升级 TypeScript -> 5.5.4
* 支持 `commonJs` + `esModule`

### nstarter-tsconfig v0.5.0

* 引入 `${configDir}` 模板变量，支持注入上下文工程实际路径
* 面向 `esModule` 与 `commonJs` 场景分别提供模板配置，支撑 Hybrid package 生成
* 升级规范至 es2022+

**Breaking changes**

* 要求 Typescript 版本 >= 5.5

**Issues**
* ES2022 额外规定了类属性的初始化顺序行为，与 TypeScript 原有行为有差异
    - https://github.com/microsoft/TypeScript/issues/52331
    - 目前通过配置 `"useDefineForClassFields": false` 保证行为的兼容性



### nstarter-core v1.2.0 

* 基础框架依赖组件升级


### nstarter-config v0.3.0

* 升级基础组件依赖
    - `nconf` -> `0.12.1`
    - `chokidar` -> `3.6.0`


### nstarter-apm v0.4.0

* 升级基础组件依赖
    - `elastic-apm-node` -> `4.7.2`


### nstarter-entity v0.4.0

* 基础组件升级
    - ajv -> 8.17.1
    - ajv-formats -> 3.0.1
    - reflect-metadata -> 0.2.2


### nstarter-grpc v0.5.0

* 组件升级
    - @grpc/proto-loader -> 0.7.13
    - @grpc/grpc-js -> 1.11.1
    - reflect-metadata -> 0.2.2
* 移除已被废弃的 `server.start()` 调用


### nstarter-lock v0.3.0

* 组件升级
    - ioredis - 5.4.0
    - redis-semaphore -> 5.6.0
      > changelog: https://github.com/swarthy/redis-semaphore/releases/tag/v5.6.0

### nstarter-metrics v0.4.0

* 组件升级
    - prom-client -> 15.1.3


### nstarter-mongodb v0.6.0

* 升级 mongoose 依赖 -> 7.8.0
    - 主要影响
        - 移除 `remove()` 方法，使用标准 `deleteOne()`, `deleteMany()` 取代
        - 移除 `update()` 方法，使用 `updateOne()`, `updateMany()` 取代
        - 移除 `callback` 异步返回支持
        - `ObjectId` 要求使用 `new` 初始化
  > 其他兼容性说明 https://mongoosejs.com/docs/7.x/docs/migrating_to_7.html
  

### nstarter-rabbitmq v0.9.0

* 组件升级
    - amqp-connection-manager -> 4.1.14
    - amqplib -> 0.10.4


### nstarter-redis v0.3.0

* 组件升级
    - ioredis -> 5.4.0


### nstarter-circular v0.4.0

* 组件升级
    - chalk -> 5.3.0
    - commander -> 12.1.0
    - madge -> 8.0.0
    - ora -> 8.0.1
