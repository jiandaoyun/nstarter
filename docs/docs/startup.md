---
title: "快速上手"
sidebar_position: 1
---

## 环境准备

使用 nstarter，需要预先安装 Node.js 环境和 npm 包管理器。

- 操作系统：支持 Windows, macOS, Linux
- 运行环境：Node.js >= 22.19.0, npm >= 10.9.0
- git 版本控制管理工具


## 安装/配置启动器

为了方便快速启动新工程，nstarter 提供了 CLI 启动器工具方便项目初始化配置。

* 安装 CLI 启动器
  
  ```bash
  npm install -g nstarter
  ```

* 配置模板工程（可选）

  ```bash
  nstarter config set repo.default <REPO_URI>
  nstarter update
  ```
  > 默认使用公共仓库 `https://github.com/jiandaoyun/nstarter-templates.git`
  > 也可以按需配置私有仓库

* 基于模板工程部署

  ```bash
  # 交互式部署（推荐）
  nstarter deploy ./demo

  # 非交互式部署
  nstarter deploy -t default -n demo -y ~/projects/demo
  ```

  按照交互引导选择需要安装的组件，并可按步骤提示选择是否执行 npm 依赖包以及 git 工作目录初始化的动作。

* 常用 CLI 命令

  ```bash
  # 查看已配置的模板
  nstarter list

  # 更新本地模板缓存
  nstarter update [repo]

  # 基于模板升级现有工程
  nstarter upgrade [target]

  # 清除本地模板缓存
  nstarter clean [repo]

  # 删除模板配置
  nstarter remove <repo>
  ```

工程启动器本身也提供了不同模板管理的能力，方便基于不同模板，创建初始化不同类型的工程目录。有关 CLI 的详细功能参数用法说明，可参考 [工程启动器](/docs/tools/starter).


## 工程目录结构

执行工程初始化以后，可以得到结构如下的标准工作目录。根据初始化过程选择的不同组件，目录内容可能存在细节上的差异，但整体结构一致。

```
<project_root>
├── ci/                         # CI 编排
├── conf.d/                     # 配置文件目录
├── server/                     # 服务端模块工程目录
│   ├── resources/              # 服务端资源文件目录
│   │   │── grpc/               # GRPC proto 结构定义文件
│   │   └── i18n/               # 国际化资源文件
│   ├── src/                    # 服务端源码
│   │   ├── components/         # 框架基础组件
│   │   │   ├── lib             # 组件配置定义
│   │   │   │   ├── logger      # 日志收集模块配置
│   │   │   │   └── monitor     # 监控模块配置
│   │   │   └── before.ts       # 组件启动前置加载项管理
│   │   ├── constants/          # 常量定义
│   │   ├── entities/           # 实体对象结构定义
│   │   ├── errors/             # 错误异常定义
│   │   ├── models/             # 数据库存储模型定义
│   │   ├── services/           # 业务方法
│   │   ├── controllers/        # 请求处理方法
│   │   ├── routes/             # Express 请求路由表
│   │   │   └── middlewares/    # Express 中间件扩展
│   │   ├── utils/              # 工程内部公用的工具方法
│   │   ├── types/              # 工程内部类型定义
│   │   ├── app.ts              # 应用主程序入口
│   │   ├── config.ts           # 全局配置
│   │   ├── context.ts          # 全局上下文定义
│   │   ├── schema.ts           # 结构约束定义 schema 装载入口
│   │   └── trace.ts            # 链路跟踪配置
│   ├── test/                   # 单元测试目录
│   ├── tools/                  # 开发工具组件
│   ├── typings/                # 模块内类型定义
│   ├── tsconfig.build.json     # TypeScript 构建配置文件
│   └── tsconfig.json           # TypeScript 开发配置文件 (IDE)
├── modules/                    # 子模块工程目录
├── typings/                    # TypeScript 公共类型定义
├── web/                        # 前端目录
│   ├── public/                 # Web 公共资源目录
│   │   ├── images/             # 前端图片资源目录
│   │   ├── js/                 # 前端 javascript 脚本目录
│   │   └── css/                # 前端样式资源目录
│   └── views/                  # Web 视图模板
├── package.json                # 全局 npm 工作目录配置
├── nx.json                     # nx 配置
├── README.md                   # 工程说明文件
└── LICENSE                     # 许可证文件
```


## 启动项目

随后在工作目录内执行工程构建，便可启动服务。

```bash
# 安装依赖
npm install

# 构建 json-schema
# note: 取决于实际工程组件依赖，此步骤可选
npm run json-schema

# 编译
npm run build

# 启动
npm run start
```

随后可以打开浏览器访问 `http://127.0.0.1:3000`
