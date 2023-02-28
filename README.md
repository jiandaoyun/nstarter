# nstarter - Node.js 模板项目启动工具

`nstarter` 是一个用来基于工程模板初始化 Node.js 项目的命令行工具。允许将各种预定义的 `包依赖`, `代码块`, `工具方法`, `业务模块` 等封装在项目模板中，来统一不同项目的开发规范。

> ⚠ 本工具当前仅适用于私有项目内部测试使用.

## 环境要求

* node.js >= 18.12.0
* npm >= 8.19.0
* git


## 安装

通过 npm 可以直接安装 nstater CLI 的最新版本。

```bash
npm install -g nstarter
```

## 使用方式

```bash
nstarter deploy [target]

CLI tools to deploy TypeScript project.

Commands:
  nstarter deploy [target]           CLI tools to deploy TypeScript project.
                                                                       [default]
  nstarter config set <key> <value>  Config nstarter options.
  nstarter list                      List all templates configured.[aliases: ls]
  nstarter update [template]         Update local template cache.  [aliases: up]
  nstarter upgrade [target]          Upgrade local project with template.
  nstarter clean [template]          Clear local template cache.
  nstarter remove <template>         Remove selected template.     [aliases: rm]

Positionals:
  target  Target project deploy path.                                   [string]

Options:
      --help      Show help                                            [boolean]
  -v, --verbose   Show debug info.                                     [boolean]
      --version   Show version number                                  [boolean]
  -n, --name      Project name.                                         [string]
  -t, --template  Template to use.                                      [string]
  -y, --yes       Proceed deploy without confirm.     [boolean] [default: false]
```

* 本地模板缓存 - `nstarter` 会将模板工程拉取到 `~/.nstarter/template/` 目录下，进行统一管理。目前支持 git 类型的模板工程，同时支持对模板工程支持更新，清理等维护性操作。


### 部署工程

通过使用 `nstarter deploy` 即可进入默认部署模式，用于基于模板初始化新的工程。`nstarter` 默认情况下也会进入部署模式，基于模板执行目标工程部署。

`nstarter` 工具默认以交互式模式运行，同时也支持非交互模式命令行下使用，以支持自动化脚本编写。通过命令行参数制定部署所必要的参数，可以进入非交互模式，例如：

```bash
nstarter deploy -t default -n demo -y ~/projects/demo
```


### 配置设定

`nstarter` 支持通过命令操作修改工具的配置参数，用于配置使用的模板等相关行为。

```bash
nstarter config set <key> <value>

Config nstarter options.

Positionals:
  key    The key to set value at.                            [string] [required]
  value  The value to set.                                   [string] [required]

Options:
      --help     Show help                                             [boolean]
  -v, --verbose  Show debug info.                                      [boolean]
      --version  Show version number                                   [boolean]
```

目前 `nstarter` 支持设置以下配置项：

| 设置 | 类型 | 说明 |
|:---:|:---:|:---|
| `template.<tag>` | string | 设定制定标签模板工程的 git 版本库 url。 |

`nstarter` 默认配置文件存储在本地用户 HOME 路径下 `~/.nstarter/config.json`。

### 查看已配置模板

使用 `nstarter list` 可查看当前本地已配置的工程模板信息。

```bash
nstarter list

List all templates configured.

Options:
      --help     Show help                                             [boolean]
  -v, --verbose  Show debug info.                                      [boolean]
      --version  Show version number                                   [boolean]
```

### 更新本地模板

通过 `nstarter update` 可以将指定工程模板的本地缓存更新到上游的最新状态。

```bash
nstarter update [template]

Update local template cache.

Positionals:
  template  Template to update.                                         [string]

Options:
      --help     Show help                                             [boolean]
  -v, --verbose  Show debug info.                                      [boolean]
      --version  Show version number                                   [boolean]
```

### 基于模板升级本地工程

可以使用 `nstarter upgrade` 操作，将本地现有工程，按照模板所提供的包依赖进行升级操作。

```bash
nstarter upgrade [target]

Upgrade local project with template.

Positionals:
  target  Target project directory.                                     [string]

Options:
      --help      Show help                                            [boolean]
  -v, --verbose   Show debug info.                                     [boolean]
      --version   Show version number                                  [boolean]
  -t, --template  Template to use.                                      [string]
  -s, --strict    Use strict version rule to upgrade.                  [boolean]
```

其中，使用严格模式 (strict) 可以将本地目标工程中的依赖包版本限定为与模板严格相等的状态，默认情况下，不启用严格模式，按照原始范围限定规则替换版本号。

### 清除本地模板缓存

使用 `nstarter clean` 可对本地模板缓存进行清理操作，通过制定模板标签清理指定模板。默认情况下清理所有模板的本地缓存。

```bash
nstarter clean [template]

Clear local template cache.

Positionals:
  template  Template to clear. Use "all" to clear all templates.
                                                       [string] [default: "all"]

Options:
      --help     Show help                                             [boolean]
  -v, --verbose  Show debug info.                                      [boolean]
      --version  Show version number                                   [boolean]
```

### 删除模板配置

通过 `nstarter remove` 操作可删除配置的模板。此操作会同时删除模板配置，并清楚缓存文件。
 
```bash
nstarter remove <template>

Remove selected template.

Positionals:
  template  Template to remove.             [string] [required] [default: "all"]

Options:
      --help     Show help                                             [boolean]
  -v, --verbose  Show debug info.                                      [boolean]
      --version  Show version number                                   [boolean]
```

## 模板开发

可以根据工程的实际需要，定制自己的 `nstarter` 模板工程，以满足不同场景下，统一项目开发规范的需求。

更多关于模板开发的详细信息，可以参考 [templating](./doc/templating.md).


## 许可

[MIT](./LICENSE)

----

Made on 🌍 with 💓.
