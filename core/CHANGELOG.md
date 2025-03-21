# Changelog

## v1.2.3

* fix: 修复 registerSvc 属性注册导致的类型定义问题

## v1.2.2

* update: 允许 registerSvc 被动态 patch，用于性能观测


## v1.2.1

* update: 适配 inversify 新版本类型编译检查


## v1.2.0

* 基础框架组件升级
  - 升级 Node.js 版本要求 >= 20.16.0
  - 升级 typescript -> 5.5.4
* 支持 `commonJs` + `esModule`


## v1.1.1

* 新增判断上下文是否初始化方法

## v1.1.0

* service 注入管理支持领域隔离注册
  - 新增 `getScopedServiceDecorators(scope)` 方法，用于生成指定领域的 service 装饰器
  - 默认 `service()`, `injectService()` 装饰器，保留全局公共域的注册行为

## v1.0.0

* 框架基础依赖整体升级
* 升级 tsconfig 规则，输出 API 兼容性版本升级至 ES2021

### Breaking
* 升级 Node.js 版本要求 >= 18.12.0
* 升级 typescript -> 4.9.5
* 升级其他基础包


## v0.6.0

* Component 支持异步初始化
  * 提供 `async init()` 方法接口，用于调用等待初始化完成
  * 原生继承 `EventEmitter` 支持事件订阅
  * ⚠ 注意：启用同步初始化机制后，对历史组件封装存在调度影响，需要调整并重新组织组件启动流程

## v0.5.6

* 新增 requestId 中间件，用用于统一初始化注入请求 id
* ContextProvider 中间件初始化支持传入 idGenerator

### Breaking
* Context 与 Logger 不在依赖 requestId 初始化
* RequestLogger 默认不再直接跟踪 requestId ，改由业务工程自行扩展元数据管理
* RequestLogger 中间件获取方法变更

## v0.5.5

* 提升 ContextProvider 在未初始化时的安全性

## v0.5.4 

* 新增支持 context 对象传递转化能力

## v0.5.3

* fix: 修正替换 URL legacy API 后的 baseURL 参数依赖问题 

## v0.5.0

### 新增功能

* 新增全局上下文管理器 ContextProvider 用于业务上下文对象的管理传递
* 新增请求对象扩展中间件
* 新增提供 BaseComponent 作为组件基类


### 依赖升级
  - winston -> 3.3.3
  - inversify -> 6.0.1


### 注意事项

* node.js 版本要求 > 14.18.x


## v0.4.0

### Breaking Changes

* `@provideSvc` 装饰器调整为 `@service`
* `@provideComponent` 装饰器调整为 `@component`
