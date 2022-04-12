---
title: "数据迁移框架"
weight: 20
---


# nstater-mongo-migrator

Mongodb 数据库结构迁移框架

## 用途

针对数据库迁移的环境，结合 kubernetes 环境的要求，采用容器化的形式进行封装。同时提供 lodash, moment 这类基础的工具方法，便于结构迁移使用，以满足基本的标准化要求。

* 提供标准统一的运行环境，以及统一的工具方法
* 能够允许以 Kubernetes Job 的方式运行迁移任务，便于在内网执行迁移
* 支持对不同环境下，部署统一应用场景的迁移任务分发


## 目录结构

```
/var/opt/migration      工作目录
├── env                 工具依赖的安装目录
│   └──package.json     依赖包定义
├── scripts             迁移脚本挂载点
│   └──index.js         迁移执行的入口脚本
├── output              输出内容的持久化挂载点
├── run.js              迁移启动脚本
└── entrypoint.sh       启动脚本
```

## 用户权限

迁移脚本执行过程中，使用 `mongodb:mongodb` 用户与用户组执行迁移任务，因而在挂载外部挂载点的过程中，需要对挂载点分配执行用户相应的操作权限。

* UID: 999
* GID: 999


## 配置

### 环境变量

迁移框架容器使用时，通过环境变量对数据库的连接配置进行配置，以更灵活的支持不同的运行环境。

* `MONGO_URI` - 数据库的连接字符串，默认值 `localhost:27017`

   支持的形式：

   ```
   192.168.0.5/foo       指定服务器默认端口 (27017) 访问指定数据库
   192.168.0.5:9999/foo  指定服务器与端口访问数据库
   mongodb://192.168.0.5:9999/foo  带协议的 URI
   ```

   需要注意，此处指定的 db 既作为数据库脚本操作数据库，也同时作为鉴权数据库。

* `USERNAME` - 登录 mongodb 服务器的用户名，使用 `MONGO_URI` 中的 db 作为
* `PASSWORD` - 登录 mongodb 服务器的密码
* `SCRIPT` - 执行的数据库操作脚本。默认为 `./scripts/index.js`
* `BUCKET` - (可选) 用于上传输出结果的 oss bucket 

### OSS 文件输出

迁移框架支持将控制台日志，以及其他迁移过程执行的输出结果，上传至 oss 进行持久存储。

* 阿里云 ossutil 配置文件可以再 kubernetes 中，通过 ConfigMap/Secret 挂载到工作目录下。配置内容示例如下，endpoint 可以根据环境来选择内网还是公网输出。

  ```ini
  [Credentials]
  language=CH
  endpoint=oss-cn-hangzhou.aliyuncs.com
  accessKeyID=<access_key_id>
  accessKeySecret=<access_key_id>
  ```

  更多详细参数说明，可参考阿里云官方文档：

  https://help.aliyun.com/document_detail/50452.html

## 使用示例

```bash
docker run \
    --env MONGO_URI=172.24.64.53:27019/nstarter \
    --env USERNAME=nstarter \
    --env PASSWORD=FineX2015 \
    --env BUCKET=xxx\
    -v /tmp/ossutilconfig:/var/opt/migration/ossutilconfig \
    nstater-mongo-migrator:latest
```

通过容器启动的方式，也可以挂载本地脚本目录后，启动进行调试。


## 工具方法

在 mongodb shell 中，由于并不具备完整的 node.js API，部分操作需要通过工具方法完成。在此介绍部分常用的工具方法，主要用于输入输出。

- `writeFile(pathToFile, stringContents)` - 输出文本到指定文件中

  示例：
  
  ```javascript
  writeFile('./output/output.txt', "output");
  ```

- `print(stringContents)` - 输出文本内容到控制台日志。

- `printjson(contents)` 与 `print(tojson(contents))` - 以 json 格式化形式输出到控制台。

- `cat(pathToFile)` - 读取指定文件的文本内容

  示例：

  ```javascript
  cat('./sample.json')
  ```

- `load(pathToFile)` - 加载外部 javascript 模块。mongodb shell 不支持通过 require 方式加载外部模块，因而提供一个简化版功能用于加载外部模块。

更多 shell 提供的内置特殊方法，可以参考官方文档。

https://docs.mongodb.com/manual/reference/method/load/

另外 mongodb shell 本身支持常用 ES6 语法，因而可在迁移过程中直接使用，不过对于少部分特殊功能，可能会存在兼容性不完整，使用时需要经过验证。


## 迁移脚本示例

默认提供的 `scirpts/index.js` 即为迁移脚本示例：

```javascript
'use strict';

// demo
print(`Current Date: ${ moment().toDate() }`);

print('List collections:');
print(_.repeat('-', 20));
print(db.getCollectionNames());
```

环境中已经默认提供 lodash, moment 等基础工具。
