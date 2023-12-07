# Changelog

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
