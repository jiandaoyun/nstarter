---
title: "nstarter-mongodb"
---

# nstarter-mongodb

nstarter-mongodb 用于对 nstarter 项目的 mongodb 数据库连接进行关联，包含连接操作的封装，维持策略，数据库连接的配置结构定义，工具装饰器等内容。

## 安装

```
npm install -s nstarter-mongodb
```

除了按照包本身以外，正常使用 nstarter-mongodb 还需要安装必要的外部依赖组件：
  * @types/mongoose
  * mongoose
  * nstarter-core

## 组件定义

在 nstarter 工程中，使用简单的组件封装定义，即可将数据库连接实例包装为全局公用的 nstarter 组件实例。

```typescript
import { component } from 'nstarter-core';

@component()
export class MongodbComponent extends AbstractComponent {
    private readonly _db: MongodbConnector;

    constructor() {
        super();
        this._db = new MongodbConnector(config.storage.mongodb, this._name);
        // 非必须配置，用于设定全局默认连接数实例
        this._db.setAsDefault();
        this._db.connect().then(() => {
            this.setReady(true);
        });
    }

    public get db() {
        return this._db.connection;
    }

    public isReady(): boolean {
        return this._db.isReady();
    }

    public async shutdown() {
        await this._db.connection.close();
        this.setReady(false);
    }
}
```

## 装饰器

除了基础的连接管理功能以外，nstarter-mongodb 还提供额外的装饰器，以简化相关场景下的应用。
 
* 事务
  
  提供有 `transaction` 方法装饰器与 `repoSession` 参数装饰装饰器，来向服务的方法中自动注入数据库操作的上下文会话，以实现所有相关的业务操作都可以在同一个数据库事务中被提交。

  ```typescript
  @provideSvc()
  export class UserService {
      @transaction()
      public async userCreateTransaction(
          admin: IUserModel, member: IUserModel, @repoSession sess?: never
      ) {
          await userRepo(sess).createOne(admin);
          await userRepo(sess).createOne(member);
      }
  }
  ```

### 配置结构

nstarter-mongodb 提供了以下的配置参数，可用于配置服务器连接方式，支持 Standalone, Replica Set, Sharded Cluster 三种不同的服务器拓扑架构。鉴权方式支持用户名密码，或者 x.509 证书方式。 

```yaml
mongodb:
  servers:
  - host: server-1
    port: 27017
  - host: server-2
    port: 27017
  replicaSet: rs
  user: user
  password: passw0rd
  x509: 
    ca: ./conf.d/mongodb-ca.crt
    cert: ./conf.d/mongodb.crt
    key: ./conf.d/mongodb.key
  timeoutMs: 10000
  db: database
```

针对标准化的配置校验，nstarter-mongodb 提供了标准的 json schema 结构定义，可以按需应用，对相关配置进行校验，以保证服务连接启动的安全性。

```typescript
import { mongodbConfigSchema } from 'nstarter-mongodb';
```

另外，也提供了 typescript 的结构定义

```typescript
import { IMongodbConfig } from 'nstarter-mongodb';
```

## 仓库方法定义

对于仓库操作方法的定义，可以基于 nstarter-mongodb 提供的模板类与工具方法实现，使用 `MongodbRepo` 配合 `repoProvider` 可以支持上下文的数据库 session 管理。当然对于无需使用 session 的场景，也可以选择不使用该特性。

```typescript
import { MongodbRepo, repoProvider } from 'nstarter-mongodb';
import { userModel } from '../models/user.model';

class UserRepo extends MongodbRepo {
    public async createOne(user: IUserModel) {
        return userModel.create([user], {
            session: this._session
        });
    }
}

export const userRepo = repoProvider(UserRepo);
```
