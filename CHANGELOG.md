# Changelog

## 0.3.0

* 升级 nstarter 框架，适配 nstarter-core 1.0
* 升级基础包依赖

### Breaking
* 升级 Node.js 版本要求 >= 18.12.0
* 升级 typescript -> 4.9.5

## 0.2.1

* fix: 补充 metricsView 请求路由的 promise 处理

## 0.2.0

* 升级 prom-client -> 14.0.x
* breaking: 抛出 LabelValues 取代 labelValue
* breaking: 各指标类型需要通过泛型定义标签类型
* breaking: metrics() 方法返回结果改为 promise
