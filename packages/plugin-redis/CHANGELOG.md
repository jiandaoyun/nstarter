# Changelog

## v0.2.0

* 移除 Connector 对外层服务的 name 管理行为
* 使用原生 EventEmitter 抛出连接事件
  * 新增事件监听类型申明
* 新增 lazyConnect 模式，支持手动调度异步初始化

### 组件升级
* 升级 nstarter 框架，适配 nstarter-core 1.0
* 升级 ioredis 依赖 -> 5.3.1x
  * 支持 redis 6+ 鉴权协议 
  * https://github.com/luin/ioredis/wiki/Upgrading-from-v4-to-v5

### Breaking
* Connector 连接实例的泛型定义转由 `getClient` 方法控制
* 移除事件中的附加消息抛出
* 升级 Node.js 版本要求 >= 18.12.0
* 升级 typescript -> 4.9.5


## v0.0.3

* 去掉nstarter-core和lodash依赖

## v0.0.2

* 重载duplicate方法

## v0.0.1

* 初始化项目
