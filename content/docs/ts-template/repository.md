---
title: "数据仓库"
weight: 30
---

## 数据仓库 (Repository)

nstarter-express 直接使用 mongoose 作为 ORM 来管理数据对象定义与实际库存储之间的关系。为了避免因为业务需要，而直接对于 ORM 本身进行调整，使用仓库模式，单独拆分了仓库层出来，用于实现对于数据库的增删改查操作。

为了支持数据库操作的上下文会话，仓库方法采用实例化的方式定义，数据库在需要的场景下，独立的数据库会话会被绑定到对应仓库对象实例上。

```typescript
import { MongodbRepo, repoProvider } from 'nstarter-mongodb';

class UserRepo extends MongodbRepo {
    public createOne(user: IUserModel) {
        return userModel.create([user], {
            session: this._session
        });
    }

    public findOneByUsername(username: string) {
        return userModel.findOne({ username }).setOptions({
            session: this._session
        }).lean(true);
    }
}

export const userRepo = repoProvider(UserRepo);
```
