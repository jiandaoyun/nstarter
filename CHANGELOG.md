# Changelog

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
