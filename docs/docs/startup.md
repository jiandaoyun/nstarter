---
title: "快速上手"
sidebar_position: 1
---

## 环境准备

使用 nstarter，需要预先安装 Node.js 环境和 npm 包管理器。

- 操作系统：支持 Windows, macOS, Linux
- 运行环境：建议选择 LTS 版本，最低要求 12.x

同时环境内还需要提供 git 版本控制管理工具。


## 安装/配置启动器

为了方便快速启动新工程，nstarter 提供了 CLI 启动器工具方便项目初始化配置。

* 安装 CLI 启动器
  
  ```bash
  npm install -g nstarter
  ```

* 配置模默认板工程

  ```bash
  nstarter config set template.default ssh://git@code.fineres.com:7999/fx/nstarter-ts-express.git
  nstarter update
  ```

* 基于模板工程部署

  ```bash
  nstarter deploy -n demo ./demo
  ```

  按照交互引导选择需要安装的组件，并可按步骤提示选择是否执行 npm 依赖包以及 git 工作目录初始化的动作。

工程启动器本身也提供了不同模板管理的能力，方便基于不同模板，创建初始化不同类型的工程目录。有关 CLI 的详细功能参数用法说明，可参考 [工程启动器](/docs/tools/starter).


## 工程目录结构

执行工程初始化以后，可以得到结构如下的标准工作目录。根据初始化过程选择的不同组件，目录内容可能存在细节上的差异，但整体结构一致。

```
.
├── conf.d/                 # 配置文件目录
├── public/                 # Web 公共资源目录
│   ├── images/             # 前端图片资源目录
│   ├── js/                 # 前端 javascript 脚本目录
│   └── css/                # 前端样式资源目录
├── resources/              # 服务端资源文件目录
│   │── grpc/               # GRPC proto 结构定义文件
│   └── i18n/               # 国际化资源文件
├── src/                    # 工程目录
│   ├── components/         # 框架基础组件
│   │   ├── lib             # 组件配置定义
│   │   │   ├── logger      # 日志收集模块配置
│   │   │   └── monitor     # 监控模块配置
│   │   └── before.ts       # 组件启动前置加载项管理
│   ├── constants/          # 常量定义
│   ├── entities/           # 实体对象结构定义
│   ├── errors/             # 错误异常定义
│   ├── models/             # 数据库存储模型定义
│   ├── services/           # 业务方法
│   ├── controllers/        # 请求处理方法
│   ├── routes/             # Express 请求路由表
│   │   └── middlewares/    # Express 中间件扩展
│   ├── utils/              # 工程内部公用的工具方法
│   ├── types/              # 工程内部类型定义
│   ├── apm.ts              # APM 探针加载入口
│   ├── app.ts              # 应用主程序入口
│   ├── config.ts           # 全局配置
│   ├── context.ts          # 全局上下文定义
│   └── schema.ts           # 结构约束定义 schema 装载入口
├── test/                   # 单元测试
├── tools/                  # 工程维护工具
├── views/                  # Express Web 视图模板
├── config.schema.json      # 配置结构校验 schema
├── tsconfig.json           # Typescript 配置文件
├── .eslintrc.js            # Eslint 规则检查配置文件
├── package.json            # npm 配置文件
├── LICENSE                 # 许可证说明
└── README.md               # 工程说明文件
```


## 启动项目

随后在工作目录内执行工程构建，便可启动服务。

```bash
# 构建 json-schema
# note: 取决于实际工程组件依赖，此步骤可选
npm run json-schema

# 编译
npm run build

# 启动
npm run start
```

随后可以打开浏览器访问 `http://127.0.0.1:3000`
