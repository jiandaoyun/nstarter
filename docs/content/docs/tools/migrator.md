---
title: "数据迁移框架 (Migrator)"
weight: 20
---

# nstarter-mongo-migrator

**nstarter Mongodb 数据库结构迁移框架**

本项目通过工程化的方式管理不同应用服务所使用数据库的结构定义，实现对数据库初始化以及结构迁移的自动化管理能力。

**主要功能**

- 指定目标 schema 版本进行数据库结构迁移
- 执行 mongosh 脚本
- dump mongodb 数据库/表

## 使用说明

### 命令行使用

```bash
nstarter-migrator

Migrate mongodb to target schema.

Commands:
  nstarter-migrator migrate            Migrate mongodb to target schema.
                                                                       [default]
  nstarter-migrator run <script>       Run mongo shell script.
  nstarter-migrator dump [collection]  Dump mongodb collection.

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
```

* `migrate` - 执行数据库 schema 迁移，迁移工具默认行为
   
   当未指定 schema 版本时，使用 `schemas` 目录下提供的最新版本。当通过 `SCHEMA_VERSION` 环境变量指定了目标版本时，则最高升级至目标版本

* `run <script>` - 执行 mongosh 脚本

* `dump [collection]` - dump 指定数据库/表
   
   - 当不指定 `collection` 参数时，则 dump 整个数据库。
   - 配置文件中可以通过 `dump.query` 参数配置 dump 过程中的查询条件 (JSON)
  
   > 参考 https://www.mongodb.com/docs/database-tools/mongodump/#syntax
  
**容器化使用**

本工具建议通过容器化环境使用，使用过程中，只需要在挂载必要的配置/输入输出目录挂载点后，传递命令参数，即可执行对应的动作。

示例：

```bash
docker run -it -v $(shell pwd)/conf.d:/var/opt/migration/conf.d \
    nstarter-mongodb-migrator:latest \ 
    run ./tasks/migrate.js
```


### 环境变量

  - `APP_NAME` - 应用服务名称，可以作为配置文件中配置参数的替代
  - `SCHEMA_VERSION` - 目标 schema 版本（可选）
  - `NODE_OPTIONS` - 可用于控制 node.js & mongosh 运行时的环境参数

### 配置文件 `conf.d/config.yml`:

```yaml
app_name: app       # 应用服务名称

mongodb:            # 数据库连接配置
  servers:
    - host: localhost
      port: 27017
  db: database
  username: db-user
  password: pa5sw0rd
  
dump:
  readPreference: primary
  gzip: true
  oplog: false
  #pipe: tee output/test.out
  output: ./output/dump.gz
  query: ./conf.d/dump_query.json

system:
  log:              # 日志输出配置
    console:
      enabled: true
      level: info
      colorize: true
    file:
      enabled: true
      level: info
      dir: ./log/
```

**实验性功能**

- 在 dump 任务执行过程中，允许通过 pipe 指定管道命令，直接将 dump 结果进行管道输出。当指定管道输出时，文件输出配置不再起作用。


### 目录结构

```text
.
├── conf.d                  # 配置文件 
│   └── config.example.yml  # 示例配置文件
├── env                     # 运行时环境配置定义
│   ├── mongosh.conf        # mongosh 配置文件
│   ├── mongoshrc.js        # mongosh 初始化配置
│   └── package.json        # 运行时环境工具包依赖配置
├── log                     # 日志输出目录
├── output                  # 默认的结果输出目录
├── resources               # 资源文件
├── schemas                 # 示例 schema 结构定义，实际应用场景下会被替换为实际数据库机构定义
├── scripts                 # 脚本目录
│   ├── hooks               # 钩子目录
│   │   ├── pre_hook.sh     # 执行前钩子脚本
│   │   └── post_hook.sh    # 执行后钩子脚本
│   └── entrypoint.sh       # 容器入口脚本
├── tasks                   # mongosh 任务脚本目录 (js)
├── src                     # 工程源码
└── VERSION                 # 版本文件
```


### 数据库模型定义

对于不同的数据库实例，要求采用规定的 schema 目录结构，定义数据库模型的变更。

- `schema_0` 用于描述当前服务所对应的数据库的初始结构。可以仅包含在业务工程中，不进行自动初始化的逻辑。比如某些表结构的索引创建等操作。
- `schema_<YYYYMMDD_xxx>` 采用日期版本编号控制某次发布所对应的结构变更，其内部用于编写迁移过程。日期版本号建议使用预估的发布上线日期。对于单一需求任务使用独立的目录维护迁移脚本，如果同一发布版本内，存在多个不同的迁移任务，可以使用不同的后缀字符串进行区分。

> ⚠️ 注意：
> - 对初始结构定义，需要与业务服务保持一致的结构，并持续性更新，确保对于新创建的数据库实例，仅需执行初始化逻辑，即可打包最新状态。
> - 所有结构迁移与初始化操作，原则上仅使用不超过应用服务所使用数据库权限执行。诸如分片划分等针对特定部署实例，单独设定的配置，不在结构模型定义的维护范畴内。此工程仅用于维护数据库的本身的逻辑结构变更。

```text
<app>
└── schemas/
    ├── schema_0/                 # 初始结构定义 (最新状态表索引等初始结构)
    │   ├── 01.xxx.js
    │   ├── ...
    │   ├── CHANGELOG.md          # 变更记录
    │   └── README.md             # 结构说明
    ├── schema_<YYYYMMDD_xxx>/    # 单次迁移变更 (日期命名，可使用计划的迭代上线时间作为日期基准)
    │   ├── lib/                  # 迁移脚本依赖 (尽可能不使用，对于 mongoshell 需要按照容器内的绝对路径引用)
    │   │   └── utils.js
    │   ├── 01.xxx.js             # 结构迁移脚本 (顺序敏感，建议使用数字序号命名文件)
    │   ├── 02.xxx.js
    │   ├── ...
    │   └── README.md             # 迁移说明 （关联 Issue，变更了什么，风险与影响）
    ├── ...
    └── README.md                 # 数据库实例说明
```


### 迁移脚本编写

数据结构模型定义，以及迁移脚本，使用 mongodb 官方提供的数据库 shell (mongosh) 实现。 mongosh 提供了 node.js 原生标准库的语法能力支持 (Node.js 16)，同时也向下兼容老版本 mongoshell 的大部分语法。并且 mongosh 还提供了 commonJS 模块的加载能力，能够装载常见的第三方库用于扩展功能。

> https://www.mongodb.com/docs/mongodb-shell/

除了原生功能以外，迁移框架预先加载了部分工具方法，可以在编写过程中，直接使用一些常用的工具库。包含：

- `lodash`
- `moment` & `moment-timezone`

另外，node.js 标准库所提供能功能也均可以直接使用。


### 连接多个数据实例

迁移框架提供了脚本执行过程中，操作多个不同数据库实例的能力。通过在配置文件中，配置 `ref_db`，可以在迁移执行的上下文，自动注入独立的数据库连接对象。

示例：

* 在 `config.yml` 中配置 `ref_db`

  ```yaml
  ref_db:
    - name: testDb
      servers:
        - host: 127.0.0.1
          port: 27017
      db: test
  ```

* 在迁移脚本中，使用前面 `name` 参数声明的变量 `testDb` 对象进行目标数据库操作

  ```javascript
  testDb.collection.find({ key: 'key' })
  ```

> ℹ️ 本地开发说明
> 本地开发/调试环境，通常并不会有默认行为，但可以在上下文中，手动使用 `connect` 方法，建立数据库连接测试。
> ```javascript
> const testDb = connect('mongodb://127.0.0.1:27017/test')
> ```


### 钩子脚本

迁移框架在 `scripts/hooks/` 目录下，提供了 `pre_hook.sh`, `post_hook.sh` 两个默认的钩子脚本入口，用于实现在任务执行前/后的其他行为动作调度。例如，下游工程在使用迁移框架过程中，可以定义自己的钩子行为，将日志/输出结果上传至对象存储。

