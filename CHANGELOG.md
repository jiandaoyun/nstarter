# Changelog

## 0.5.0

* 升级 `amqplib`, `amqp-connection-manager` ，移除 `bluebird` 依赖，避免 async-hooks 传递影响
* 提供 `AmqpConnector.connect()` 方法，用于同步建立 rabbitMq 连接

* Breaking Changes: 
  - `AmqpConnector` 连接对象创建后，不在自动建立连接，需要调用 connect 方法管理连接建立

## 0.4.2

* 提供 AmqpConnectionManager 类型定义，用于扩展实现
* 提供 amqplib 类型定义默认依赖

## 0.4.1

* 修复上下文可能未被正确传递的问题

## 0.4.0

* 引入 nstarter-core 的 ContextProvider，支持队列任务上下文传递能力

## 0.3.0

* 升级 amqplib -> 0.8.0
* 升级 amqp-connection-manager -> 3.7.0
* 升级框架组件版本

## 0.2.8 

* 固定amqp-connection-manager的版本，使其与fx-code一致


## 0.2.7

* 修正内存重试模式下，首次执行触发 retry 事件的问题
