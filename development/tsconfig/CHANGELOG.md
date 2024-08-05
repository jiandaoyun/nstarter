# Changelog

## v0.5.0

* 引入 `${configDir}` 模板变量，支持注入上下文工程实际路径
* 面向 `esModule` 与 `commonJs` 场景分别提供模板配置，支撑 Hybrid package 生成
* 升级规范至 es2022+

### Breaking changes

* 要求 Typescript 版本 >= 5.5

### Issues
* ES2022 额外规定了类属性的初始化顺序行为，与 TypeScript 原有行为有差异
  - https://github.com/microsoft/TypeScript/issues/52331
  - 目前通过配置 `"useDefineForClassFields": false` 保证行为的兼容性


## v0.4.0

* 升级输出以及 lib 引用版本 -> es2021
* module 规则调整为 node16, 支持 esm 模块输出

### Breaking changes

* 要求 Typescript 版本 >= 4.7
* 兼容 Node.js 版本 >= 16.0.0


## v0.3.0

* 升级输出版本 -> es2020，提高最低适配至 node 14
* 增加 ts-node 默认配置参数
