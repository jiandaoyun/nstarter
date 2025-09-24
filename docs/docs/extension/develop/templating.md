---
title: "模板管理"
sidebar_position: 2
---


# 模板开发

### 模板仓库结构

`nstarter` 支持通过 monorepo 的方式管理多个模板工程，允许在单个仓库中统一维护不同类型的项目模板，例如 web 服务 / npm 包 / 函数计算 等。这种组织方式便于版本管理、依赖共享和统一发布。

```
<template-repository>
├── package.json                    # 仓库根目录的 npm 包配置
├── README.md                       # 仓库说明文档
├── LICENSE                         # 许可证文件
└── templates/                      # 模板集合目录
    ├── <project-1>/                # 第一个项目模板
    │   ├── .ns_template/           # 模板配置目录
    │   │   ├── module.conf.yml     # 模块配置文件
    │   │   └── CHANGELOG.md        # 模板变更日志（可选）
    │   ├── package.json            # 项目的 npm 包描述文件
    │   ├── README.md               # 模板的 README 文件（可选）
    │   ├── .editorconfig           # 模板编辑器配置（可选）
    │   ├── .gitignore              # Git 仓库忽略文件模板（可选）
    │   └── tsconfig.json           # 项目 TypeScript 配置文件（可选）
    ├── <project-2>/                # 第二个项目模板
    │   ├── .ns_template/           # 模板配置目录
    │   ├── README.md               # 模板的 README 文件（可选）
    │   ├── .gitignore              # Git 仓库忽略文件模板（可选）
    │   └── ...                     # 其他项目文件
    └── <project-n>/                # 更多项目模板
        ├── .ns_template/           # 模板配置目录
        ├── README.md               # 模板的 README 文件（可选）
        ├── .gitignore              # Git 仓库忽略文件模板（可选）
        └── ...                     # 其他项目文件
```


你可以按照 `nstarter` 的模板规则创建自定义模板项目。模板项目可以打包任何你需要的*库*/*技术栈*/*代码*/*文档*/*结构*，构建成你的个人瑞士军刀来生成新项目。

> ⚠ Breaking
> 从 nstarter-cli 1.x 版本起，仅支持 v2 版本模板工程。


## 模块配置

模板项目在 `.ns_template/` 目录中，应包含一个简单的 `module.conf.yml` 文件，该文件包含以下选项来描述基础项目中的模块。使用模板项目部署时，此模块配置将帮助选择用户想要使用的组件。只有用户选择的相应模块才会被初始化到生成的项目中。

* `module_types`

  `module_types` 定义第一级模块类别，用于对当前模板项目中的不同模块进行分组。

  ```yaml
  module_types:
    - name: basic           # 引用名称
      label: 基础模块           # 显示名称
  ```

* `modules`

  模块是组织模板项目中项目的基本单位。模块定义可以包含*代码/资源文件*、*配置文件*、*模块依赖*等资源描述。例如：

  ```yaml
  modules:
    - name: example         # 当前模块的名称，用作引用标识
      label: 示例模块
      type: basic           # 当前模块的类别，在 `module_types` 中声明
      default: true         # 是否默认启用
      files:                # 仅此模块使用的项目文件路径
        - src/example.ts
      config:               # 当前模块，在模板项目配置文件中定义的配置选项路径
        - server.example
      packages:             # 当前模块所需的 npm 包
        - lodash
      dependencies:         # 此模块所需的其他模板模块的模块名称
        - http
      scripts:              # 当前模板私有的脚本
        - example
  ```

* `ignore_files`

  模板项目也可以在此部分配置部署时要忽略的文件，使用 glob 格式。

  ```yaml
  ignore_files:
    - .git/**
  ```

**注意：** 模块配置文件中的所有路径都从模板根目录开始，即项目中的 `templates/<project>/`。


## 代码模块化

使用自定义模块启动新项目时，被排除模块的实现不应被初始化到项目中。由于模块代码不仅可以在独立的源代码文件中使用，还可以与其他模块一起使用（如在"main"文件中），`nstarter` 提供了声明多个模块代码块的规则。

模块代码块以双斜杠注释行开始，带有 `#module` 前缀，后跟在 `module.conf.yml` 中声明的模块 `name`。模块代码块应以类似的注释行结束，带有 `#endmodule` 前缀。

此外，模块代码块可以相互嵌套。

下面的代码是单个文件中代码模块化的示例。

```typescript
export const app = express();
app.enable('trust proxy');

//#module web
// view engine setup
app.set('views', config.server.static.views);
app.set('view engine', 'pug');

// static file path
app.use(express.static(config.server.static.public));

// session store
//#module redis
const RedisStore = connectRedis(session);
//#endmodule redis
app.use(session({
    secret: config.server.session.secret,
    name: config.server.session.name,
    resave: false,
    saveUninitialized: false,
    //#module redis
    store: new RedisStore({
        client: Database.redis.connection
    }),
    //#endmodule redis
    cookie: config.server.cookie.policy
}));

// parser setup
app.use(express.json({
    limit: '1mb'
}));
app.use(express.urlencoded({
    limit: '1mb',
    extended: false
}));
app.use(cookieParser());
//#module i18n
app.use(i18n.middleware);
//#endmodule i18n

// request log
if (config.system.req_log.enabled) {
    app.use(reqLogger.middleware);
}

app.use('/', router);
//#endmodule web

export const server = http.createServer(app);
```

替代代码块可以用 `//#alt` 和 `//#endalt` 包围的注释行声明，用于替换模块代码块。当模块代码块在目标项目中未使用时，它将被替代代码替换。

```typescript
return res.render('welcome', {
    //#module i18n
    //#alt
    //# title: 'To Infinity and Beyond!'
    //#endalt
    title: req.i18n.t('page.demo.title')
    //#endmodule i18n
});
```

## 模板参数

`nstarter` 还支持使用文档文件（如 Markdown）初始化项目，并提供一些模板参数使创建新项目更加便捷。你可以在任何非代码文件中使用 `${PARAM}` 声明要被相应模板参数替换的字符串。

以下是 `nstarter` 当前提供的模板参数。

| 键 | 说明 |
|:---:|---|
| `APP_NAME` | 由 `nstarter` 配置的项目名称。 |
| `YEAR` | 使用 `nstarter` 初始化项目的年份。 |

未来将提供更多模板参数。


## 模板示例

在 Github 上找到更具体的模板项目 `nstarter-templates` 参考，该项目也是 `nstarter-cli` 工具的默认模板。

[https://github.com/jiandaoyun/nstarter-templates](https://github.com/jiandaoyun/nstarter-templates)
