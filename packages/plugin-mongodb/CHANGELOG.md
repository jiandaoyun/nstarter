# Changelog

## 0.6.0

* 升级 nstarter-core -> 1.2.0
    - 运行时环境 Node.js >= 20.16.0
    - TypeScript -> 5.x
* 升级 mongoose 依赖 -> 7.8.0 
  - 主要影响
    - 移除 `remove()` 方法，使用标准 `deleteOne()`, `deleteMany()` 取代
    - 移除 `update()` 方法，使用 `updateOne()`, `updateMany()` 取代
    - 移除 `callback` 异步返回支持
    - `ObjectId` 要求使用 `new` 初始化
  > 其他兼容性说明 https://mongoosejs.com/docs/7.x/docs/migrating_to_7.html
* 支持 `commonJs` + `esModule`


## v0.5.2
* 添加 `isValidObjectId` 方法，用于判断是否为有效的 ObjectId
* 添加 `isObjectIdEqual` 方法，用于判断两个 ObjectId 是否相等

## v0.5.1
* 调整默认的 mongoose 全局配置，兼容老版本
* 升级 mongoose 开发依赖 -> 6.12.0

## v0.5.0
* 提供统一的 ObjectId、MongoId 类型定义及空对象判断方法
* 引入 mocha 测试框架，新增 utils 测试用例
* 升级 mongoose 依赖 -> 6.11.5
  * 修复 init 方法存在的原型污染漏洞(>= 6.11.3)
    > https://github.com/advisories/GHSA-9m93-W8W6-76hh

## v0.4.0
* 支持自定义 MongoDBRepo 实例注册中心

## v0.3.0

* 升级 nstarter 框架，适配 nstarter-core 1.0
* 升级 mongoose 依赖 -> 6.9.x+
  * 驱动连接层 `useNewUrlParser`, `useUnifiedTopology`, `useCreateIndex` 始终为 `true`，不再需要额外配置
  * X.509 证书改由驱动层直接加载
  > https://mongoosejs.com/docs/migrating_to_6.html

### Breaking
* 升级 Node.js 版本要求 >= 18.12.0
* 升级 typescript -> 4.9.5

## v0.2.6

* 注册 `@mongoosejs/async-hooks` 插件，避免 async-hook 丢失问题

## v0.2.5

* 适配 Mongodb Atlas 连接协议

## v0.2.4

* 适配 Azure Mongodb 连接协议

## v0.2.3

* 升级 nstarter-core -> 0.5.x

## v0.2.2

* 调整 mongoose 作为 peer dependency 依赖

## v0.2.1

* 移除 mongoose 类型定义依赖

## v0.2.0

* 升级 mongoose -> 5.13.13，并改为包内管理依赖
* 优化重连策略，连接失败时等待 5s 重连，避免集群产生大量持续重连请求阻塞数据库

## v0.1.1

* 增加 repo 基类定义模板，以及 repoProvider
