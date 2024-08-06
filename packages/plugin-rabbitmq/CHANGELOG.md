# Changelog

## 0.9.0

* 升级 nstarter-core -> 1.2.0
  - 运行时环境 Node.js >= 20.16.0
  - TypeScript -> 5.x
* 组件升级
  - amqp-connection-manager -> 4.1.14
  - amqplib -> 0.10.4


## 0.8.0

* 升级nstarter-core包，调整消费者默认注入上下文逻辑


## 0.7.1

* 使用 Channel#ack 替代 ChannelWrapper#ack，以防止 ChannelWrapper 重连后使用错误的 Channel 去 ack 消息

## 0.7.0

* 支持传递客户端信息，注册到服务端统一观察消费者信息
  * 默认补充传递当前节点 hostname 

* Breaking changes:
  * 移除延迟队列相关兼容性，不再提供 pushDelay 配置参数

## 0.6.5
* 替换npm代理
  
## 0.6.4
* 消费端默认生成一个请求上下文信息

## 0.6.3

* 修复 channel 重建后，会导致 prefetch 不生效的问题

## 0.6.1 

* 移除额外的 nstarter-utils 依赖

## 0.6.0
* 升级 nstarter 框架，适配 nstarter-core 1.0
* 升级基础依赖
  - amqplib -> 0.10.3
  - amqp-connection-manager -> 4.1.10

### Breaking
* 升级 Node.js 版本要求 >= 18.12.0
* 升级 typescript -> 4.9.5

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
