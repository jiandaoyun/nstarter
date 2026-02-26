# nstarter
<p align="center">
    <img src="https://nstarter-docs.jdydevelop.com/img/logo.png"
        height="128">
</p>

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white)
![Nx](https://img.shields.io/badge/nx-143055?style=for-the-badge&logo=nx&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)


## 简介

nstarter 是一套面向 Node.js + TypeScript 工程开发，设计的工程治理脚手架，目标是简化团队协作场景下多工程维护复杂度。

通过不同的模块组件，配合工程启动模板，可以实现 Node.js 项目的快速搭建，统一工程结构组织形式，降低团队协作负担。框架中已提供的模块包括公共核心组件，外围扩展包，开发环境配置管理等一系列工具。

关于 nstarter 框架及各组件的详细使用介绍，以及 API 接口使用说明，可进一步参考 [使用文档](https://nstarter-docs.jdydevelop.com/) .


## 框架组件

- [`nstarter-core`](./core) - 框架核心组件

### 扩展包

- [`nstartre-config`](./packages/config) - 配置装载管理器
- [`nstarter-cache`](./packages/plugin-cache) - 缓存管理
- [`nstarter-entity`](./packages/plugin-entity) - 数据传输结构实体化管理工具
- [`nstarter-grpc`](./packages/plugin-grpc) - GRPC 通信插件
- [`nstarter-http-request`](./packages/plugin-http-request) - HTTP 请求客户端插件，SSRF 防护、日志、正向代理等
- [`nstarter-lock`](./packages/plugin-lock) - 分布式锁插件，基于 Redis 实现
- [`nstarter-metrics`](./packages/plugin-metrics) - 监控指标采集跟踪组件，基于 prometheus 规范
- [`nstarter-mongodb`](./packages/plugin-mongodb) - mongodb 连接管理组件
- [`nstarter-otel-trace`](./packages/plugin-otel-trace) - OpenTelemetry 分布式链路跟踪插件，用于业务方法的执行跟踪与性能分析
- [`nstarter-rabbitmq`](./packages/plugin-rabbitmq) - rabbitmq 连接管理组件
- [`nstarter-redis`](./packages/plugin-redis) - redis 连接管理组件
- [`nstarter-utils`](./packages/utils) - 通用工具包


### 开发组件

- [`nstarter-cli`](./cli) - 工程启命令行工具
- [`nstarter-circular`](./tools/circular) - 循环依赖检测工具
- [`nstarter-tsconfig`](./development/tsconfig) - TypeScript 规则模板


## 开发说明

`nstarter` 框架工程采用 [NX](https://nx.dev/) 配合 npm workspace 的方式，将各独立组件以 monorepo 的形式统一纳入管理。

### 开发准备

* 依赖安装

  ```bash
  npm install
  ```

* 编译构建

  ```bash
  npm run build
  ```

* 单元测试

  ```bash
  npm run test
  ```

* 代码质量检查

  ```bash
  npm run eslint
  ```

### 工程目录结构

```text
<nstarter>
├── ci/
│   └── toolbox/                # CI 构建工具
├── cli/                        # 命令行启动器
├── core/                       # 框架核心 (nstarter-core)
├── development/                # 开发组件
│   └── tsconfig/               # TypeScript 配置模板 (nstarter-tsconfig)
├── docs/                       # 文档
├── packages/                   # 扩展组件包
│   ├── config                  # 配置装载管理 (nstarter-config)
│   ├── package-*/              # 插件包
│   └── utils/                  # 通用工具包 (nstarter-utils)
├── tools/                      # 开发工具组件
├── typings/                    # TypeScript 公共类型定义
├── package.json                # 全局 npm 工作目录配置
├── nx.json                     # nx 配置
├── README.md                   # 工程说明文件
└── LICENSE                     # 许可证文件
```

## LICENSE

[MIT](./LICENSE)

------
NStarter Team, Build on 🌍 with 💓.
