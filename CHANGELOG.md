
## v0.5.0

### 新增功能

* 新增全局上下文管理器 ContextProvider 用于业务上下文对象的管理传递
* 新增请求对象扩展中间件
* 依赖升级
  - winston -> 3.3.3


### 注意事项

* node.js 版本要求 > 12.17.x


## v0.4.0

### Breaking Changes

* `@provideSvc` 装饰器调整为 `@service`
* `@provideComponent` 装饰器调整为 `@component`
