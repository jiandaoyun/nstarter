# Changelog

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
