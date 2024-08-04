# Changelog

## 0.4.0

* 升级 nstarter-core -> 1.2.0
  - 运行时环境 Node.js >= 20.16.0
  - TypeScript -> 5.x
* 支持 `commonJs` + `esModule`
* 升级基础组件依赖
  - `elastic-apm-node` -> `4.7.2`


## 0.3.0

* 升级 nstarter-core -> 1.0.0

### Breaking Changes

* 升级 Node.js 版本要求 >= 18.12.0
* 升级 typescript -> 4.9.5


## 0.2.1

* 升级 nstarter-core -> 0.5.x

## 0.2.0 

* 升级 elastic-apm-node -> 3.25.0
* 调整依赖管理形式，由插件包装并抛出 apmAgent
* 引入 nstarter-core 统一管理日志
* transaction 不在支持已被 APM server 弃用的 subtype, action 参数

## 0.1.0

* 提供基础 `apmTransaction`，`apmSpan` 装饰器封装
