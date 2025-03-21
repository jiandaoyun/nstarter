# Changelog

## v0.5.0
* 升级 nstarter-core -> 1.2.0
  - 运行时环境 Node.js >= 20.16.0
  - TypeScript -> 5.x
* 组件升级
  - @grpc/proto-loader -> 0.7.13
  - @grpc/grpc-js -> 1.11.1
  - reflect-metadata -> 0.2.2
* 移除已被废弃的 `server.start()` 调用
* 支持 `commonJs` + `esModule`


## v0.4.2
* 添加 `keepalive` 机制, 修复隔段时间随机 `CALL CANCELLED` 错误
* npm源更换为华为云镜像源

## v0.4.1
* 修改反序列化错误方法, 使得原始 `GRPC` 错误码信息保留

## v0.4.0
* 升级 nstarter 框架，适配 nstarter-core 1.0
* 升级基础依赖
    - @grpc/proto-loader -> 0.7.4
    - @grpc/grpc-js -> 1.8.8

### Breaking
* 升级 Node.js 版本要求 >= 18.12.0
* 升级 typescript -> 4.9.5


## v0.3.6

* 升级 nstarter-core -> 0.5.x

## v0.3.4

* 升级依赖包

## v0.3.0

* 使用 @grpc/grpc-js 取代已不再继续维护的 grpc 包
