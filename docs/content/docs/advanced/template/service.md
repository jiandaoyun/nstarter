---
title: "业务服务"
weight: 20
---

## 业务服务 (Service)

后台服务的核心部分是业务的实现逻辑，nstarter 中提供了专门的服务层用于统一管理各式各样的业务处理逻辑。服务层关注的业务加工的逻辑本身，而不是前向后向的上下游连接。对于项目中需要提供的具体功能业务，都应该在服务层定义其具体实现。

### 服务定义

在 nstater 中，服务对象会被注册到服务层的 IoC 容器上供其他地方统一调用。为了方便服务对象的声明和引用，框架上向服务层内部提供了 `service` 和 `injectService` 装饰器。简单的服务定义示例如下：

```typescript
@service()
export class PingService {
    @injectService()
    private pongService: PongService;

    public ping() {
        console.log('ping');
    }

    public pong () {
        this.pongService.pong();
    }
}
```

其中的 `service` 装饰器用于定义服务对象，而 `injectService` 装饰器则用于在服务对象中引用其他服务对象。

服务对象定义在 `src/services` 目录中，在定义完成后，还需要通过框架提供的 `registerSvc` 与 `getSvc` 两个工具方法，将其注入到服务层 IoC 容器上，并抛出实例化的服务对象给外部调用。注册位置统一在 `src/services/index.ts` 中。

```typescript
registerSvc(PingService);
registerSvc(PongService);

export const pingService = getSvc<PingService>(PingService);
export const pongService = getSvc<PongService>(PongService);
```

### 服务引用

对于服务对象的引用，在服务层内部，需要通过前面提到的 `injectService` 装饰器来注入到目标依赖服务对象上。而在服务层外部，如控制器与中间件中，可以直接使用服务层抛出的对象本身。

### 存储事务

并不是所有的业务逻辑都是可以简单线性执行的实现，部分业务会依赖到后端数据库存储上的事务特性实现。对于需要使用到存储事务的业务方法，`nstarter` 在 `nstarter-mongodb` 组件包中提供了 `transaction` 方法装饰器与 `repoSession` 参数装饰装饰器，来向服务的方法中自动注入数据库操作的上下文会话，以实现所有相关的业务操作都可以在同一个数据库事务中被提交。

```typescript
import { repoSession, transaction } from 'nstarter-mongodb';

@service()
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
