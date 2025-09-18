---
title: "插件开发"
sidebar_position: 1
---

# 插件包规范

对于 nstarter 工程中使用到的公共但是并不普遍需要的工具性质的组件，可以采用将其插件化，封装为 npm 包的形式统一管理，以便于通过包升级的形式，在不同工程中同步维护。


## 目录结构

对于统一在 nstarter 仓库内，以 monorepo 方式维护的插件包，其工程目录通常以 `plugin-<name>` 的方式命名，并在 `packages/` 目录下统一管理。对于相关插件的开发，通过 npm workspace 机制，能自动实现各插件包之间可以自动进行依赖解析和引用，实现本地开发调试。

```bash
plugin-<name>/
├── package.json        # 插件 npm 包属性声明
├── tsconfig.json       # Typescript 配置文件
├── readme.md           # 说明文件
├── changelog.md        # 变更记录文件，记录版本更新日志
├── typings             # 插件全局使用的类型定义声明 (可选)
├── src
│   └── index.ts        # 插件组件入口
└── test                # 自动化测试 (可选)
```

同时也可以通过单独的 npm 包项目工程来管理，并使用 npm link 进行开发联调。


## 插件开发配置

* `package.json`

  对于 npm 包本身的定义，

  ```json
  {
      "name": "nstarter-<name>",
      "scripts": {
          "build": "rimraf dist && tsc --build tsconfig.json"
      },
      // 被引用时使用的代码
      "main": "./dist",
      "dependencies": {
          // 依赖
      },
      "devDependencies": {
          // 开发依赖
      }
  }
  ```

  将 types 定义为 src 目录，可以使得插件包在被引用开发的过程中，直接在 IDE 编辑器中链接被引用的对象到源码定义中，而不是 `d.ts` 的类型接口定义。插件在进行 npm 发布过程中，可以带上 src 文件一起发布。

* `.npmrc`

  通常情况下，需要配置 npm registry 为 npmjs 官方的地址，用于发布到官方镜像中，避免被本地全局规则影响。

  ```conf
  registry=https://registry.npmjs.org
  ```



## 插件开发注意事项

* nstarter 插件开发过程中，尽量依赖 nstarter-core 中的公共组件。否则可能会导致引用到与实际工程中所使用的公共组件因为版本不一致的原因，出现 plugin 中的依赖的组件并没有被正确初始化配置的问题。
* 对于存在 `nstarter-core` 依赖的插件，需要严格注明对应依赖的 `peerDependency` 版本，而不是自行引入依赖，核心包中的诸多功能，仅在单例状态下生效。
* nstarter 插件在开发过程中，尽可能在非必要情况下少依赖重型的第三方工具包，如 lodash, async 等，以降低开发维护成本。


## 插件使用

对于需要被使用的 nstarter 项目工程，通过常规 npm 包的引用安装方式安装使用。

```bash
npm install -s nstarter-<name>
```

安装完成后，便可在代码中直接引用插件所开放的组件。

```typescript
import { XXX } form 'nstarter-<name>';
```
