---
title: "插件开发"
weight: 10
---

# 插件包规范

对于 nstarter 工程中使用到的公共但是并不普遍需要的工具性质的组件，可以采用将其插件化，封装为 npm 包的形式统一管理，以便于通过包升级的形式，在不同工程中同步维护。


## 目录结构

```
. nstarter-plugin-<name>
├── package.json
├── tsconfig.json
├── readme.md
├── typings (可选)
├── src
│   ├── lib
│   ├── decorators.ts (可选)
│   ├── constants.ts (可选)
│   ├── types.ts (可选)
│   └── index.ts 
└── test (可选)
```

* `package.json` - 插件 npm 包属性声明
* `tsconfig.json` - Typescript 配置文件
* `readme.md` - 说明文件
* `src/lib` - 插件提供的功能方法实现，其内部结构不作具体规范限定
* `src/decorators.ts` - 插件向外部提供等装饰器，根据实际提供的情况，可以调整为目录结构
* `src/constants.ts` - 插件包中自带，或者允许被外部引用的常量定义
* `src/types.ts` - 插件内部使用的类型接口结构定义
* `src/index.ts` - 插件组件入口
* `typings` - 插件全局使用的类型定义声明
* `test` - 自动化测试


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
      // 使用源代码作为类型定义
      "types": "./src",
      "dependencies": {
          // 依赖
      },
      "devDependencies": {
          // 开发依赖
      }
  }
  ```

  一般规定，nstarter 插件工程以 `nstarter-plugin-<name>` 的方式命名，但是为了引用上的方便，npm 包的名称定义可以采用 `nstarter-<name>` 的方式进行简化。

  将 types 定义为 src 目录，可以使得插件包在被引用开发的过程中，直接在 IDE 编辑器中链接被引用的对象到源码定义中，而不是 `d.ts` 的类型接口定义。插件在进行 npm 发布过程中，可以带上 src 文件一起发布。

* `.npmrc`

  通常情况下，需要配置 npm registry 为 npmjs 官方的地址，用于发布到官方镜像中，避免被本地全局规则影响。

  ```conf
  registry=https://registry.npmjs.org
  ```


## 插件的本地引用开发

本地开发过程中，可能会需要在引用插件的工程中对开发版本的插件进行调试。推荐采用 npm link 的方式管理本地开发过程中的插件依赖。

首先在插件工程下执行 npm link 将插件包本身链接到本地全局的 npm 环境中。

```bash
npm link
```

随后便可以在目标工程中，直接来链接引用 npm 插件：

```bash
npm link nstarter-<name>
```

注意其链接的名称为 npm 包的名称，而不是工程的名称。

除了上述方式以外，也可以直接采用本地相对路径或者绝对路径来进行引用，只需要一步操作即可完成。

```bash
npm link ../nstarter-plugin-<name>
```


## 插件开发注意事项

* nstarter 插件开发过程中，不应当依赖 nstarter-core 中的公共组件。否则可能会导致引用到与实际工程中所使用的公共组件因为版本不一致的原因，出现 plugin 中的依赖的组件并没有被正确初始化配置的问题。
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
