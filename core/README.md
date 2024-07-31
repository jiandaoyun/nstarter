# nstarter-core

nstarter 框架核心组件

## 组件使用介绍

### 服务注册

在 nstarter 框架中，服务主要承载业务中核心的实现逻辑部分。考虑到本身业务之前各服务之间存在有互相调用的灵活需求，业务服务同样通过 IoC 容器来注册管理，同时也可以实现服务层内部发现。

nstarter-core 针对服务管理提供了对应的工具方法与装饰器：

```typescript
import {
    service,
    injectService,
    registerSvc,
    getSvc
} from 'nstarter-core';
```

* 服务注册

  服务对象统一以实例化的类进行定义，对应的业务逻辑方法直接申明在相关的类上。服务对象使用时，一般以单例方式，或者也可以采用实例化的方式引用。在定义服务对象时，与组件定义的过程类似，使用 `service` 装饰器来为相关对象自动绑定作为服务对象引用的相关元数据信息。

  ```typescript
  import { service } from 'nstarter-core';
  
  @service()
  export class PingService {
      public ping() {
          console.log('ping');
      }
  }
  ```

  `service` 装饰器支持可选传入一个标识符用于标识注册的服务对象。定义标识后，在引用时也可以使用同样的标识符进行引用。服务标识可以是 `string` 或者固定的 `Symbol` 对象。默认情况下，`service` 会根据定义的服务对象类名自动生成对应的标识符用于使用，而无需额外自定义管理。

  在完成服务对象定义后，还需要将对应的服务对象注册到服务管理容器上，一般使用 `registerSvc` 方法来实现。同时，对于在服务层外部获取的服务对象，可以直接通过使用 `getSvc` 工具方法来引用出被注册的对象实例。

  ```typescript
  import { registerSvc, getSvc } from 'nstarter-core';
  import { PingService } from './ping.service';
  
  registerSvc(PingService);

  export const pingService = getSvc<PingService>(PingService);
  ```

* 内部服务引用

  对于服务层内部的的其他服务之间互相引用，可以通过 `injectService` 装饰器配合 `service` 装饰器的申明，来将被依赖的业务服务实例直接注册到目标服务对象上，随后便可以直接使用对应依赖的业务方法执行相关的业务逻辑调用。

  `injectService` 与 `service` 类似，同样提供了一个可选参数，用于传入引用的服务对象标识符。默认情况下，目标对象的类属性只要满足对应对象类名的驼峰命名规则，即可在不定义标识符的情况下自动完成发现与注册。例如，使用 `PingService` 定义的服务对象，在被其他服务对象引用时，直接使用 `pingService` 参数引用即可自动完成关联引用。在需要自定义的场景下，也支持配置自己所需要的标识符进行标识引用。

  ```typescript
  import { PingService } from './ping.service';
  import { injectService, service } from 'nstarter-core';
  
  @service()
  export class PongService {
      @injectService()
      private pingService: PingService;
  
      public pong() {
          console.log('pong');
      }
  
      public ping() {
          this.pingService.ping();
      }
  }
  ```

* 领域隔离的服务管理

  > ℹ️ `nstarter-core`: `1.1.0` 版本在支持的新特性。

  在不同类型的工程实际服务层逻辑组织中，对于一些封装有复杂服务层逻辑的 npm 业务工程包，或者使用 monorepo 方式管理的复杂独立模块工程项目，如果仍然维持将所有不同领域的服务对象，注册到同一个公共服务管理容器中，会带来一系列的服务管理和使用上的困境。典型的例子，由于服务对象的开发实现会按照模块隔离，不同模块下无法直接关注到其他模块服务对象的定义实现，使用公共注册容器，会直接导致服务注册域使用的冲突。

  为了解决这个问题，`nstarter-core` 从 `1.1.0` 版本开始，引入了服务对象的领域隔离管理机制。通过使用 `getScopedServiceDecorators` 装饰器生成方法，可以生成指定领域下的服务层装饰器。获取对应领域的 `service`, `injectService` 装饰器后，便可通过与默认全局装饰器完全相同的方式来使用。

  ```typescript
  import { getScopedServiceDecorators } from 'nstarter-core';
  
  const scope = Symbol.for('demo_scope');
  
  const { service, injectService } = getScopedServiceDecorators(scope);
  ```

### 请求上下文 

nstater-core 从 0.5 版本开始，提供了全局 `ContextProvider` 对象用于业务与请求上下文对象调度管理。

基本使用流程如下:

1. 使用 `ContextProvider.initialize` 传入上下文对象类定义进行初始化。
2. 通过 `ContextProvider.getMiddleware()` 获取请求中间件。
   - 对于非请求业务场景，如队列任务消费，可通过 `ContextProvider.startContext()` 启动上下文跟踪，但此方法不适合被用于全局静态方法，或 eventEmitter 事件响应处理中。
3. 在业务逻辑中，通过 `ContextProvider.getContext()` 获得上下文对象来使用。

注意事项:
  - 建议在工程代码加载的最初始阶段执行 provider 的初始化逻辑，避免被部分异步初始化的包干扰。
  - 上下文传递基于 AsyncLocalStorage 实现，需要使用 node.js 12.17.x 之后的版本
  - 部分包中 callback API 实现的方式，会导致上下文跟踪状态丢失，如 mongoose。一般推荐使用 async/await。 

```typescript
import { Router } from 'express';
import { ContextProvider } from 'nstarter-core';
import { Context } from '../context';

// step 1: 使用上下文中间件
ContextProvider.initialize(Context);

const router = Router();

// step 2: 注册路由中间件
router.use(ContextProvider.getMiddleware());

class ExampleController {
    public async doFind(req: Request, res: Response) {
        // 异步方法
        const user = await find();

        // step 3: 获取上下文对象使用
        const context = ContextProvider.getContext();
        context && logger.info(context.requestId);
        
        return res.json({ user });
    }
}
```


## License
MIT
