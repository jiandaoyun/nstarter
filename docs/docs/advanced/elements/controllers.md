---
title: "控制器 (Controllers)"
weight: 203
---

## 控制器管理
在 nstarter 框架中, 控制器主要承载业务中核心的实现逻辑部分. 考虑到本身业务之前各控制器之间存在有互相调用的灵活需求, 业务控制器同样通过 IoC 容器来注册管理, 同时也可以实现控制器层内部发现.

nstarter-core 针对控制器管理提供了对应的工具方法与装饰器：
```typescript
import {
    controller,
    injectController,
    registerCtl,
    getCtl
} from 'nstarter-core';
```
* 控制器注册
  控制器对象统一以实例化的类进行定义, 对应的路由方法直接声明在相关的类上. 控制器对象使用时, 一般以单例方式, 或者也可以采用实例化的方式引用. 在定义控制器对象时, 与组件定义的过程类似, 使用 `controller` 装饰器来为相关对象自动绑定作为控制器对象引用的相关元数据信息.

  ```typescript
  import { controller } from 'nstarter-core';
 
  @controller()
  export class PingController {
      public ping(
          req: Request,
          res: Response
      ): void {
          res.end('pong');
      }
  }
  ```
  `controller` 装饰器支持可选传入一个标识符用于标识注册的控制器对象. 定义标识后, 在引用时也可以使用同样的标识符进行引用. 控制器标识可以是 `string` 或者固定的 `Symbol` 对象. 默认情况下, `controller` 会根据定义的控制器类名自动生成对应的标识符用于使用, 而无需额外自定义管理.

  nstarter 的 IoC 机制不会根据注解自动感知控制器类并注册, 因此需要手动编码完成这一过程. 与 `component`和`service`类似, 一般使用 `registerCtl` 方法来实现. 同时, 对于在控制器层外部获取的控制器对象, 可以直接通过使用 `getCtl` 工具方法来引用出被注册的对象实例.

  ```typescript
  import { registerCtl, getCtl } from 'nstarter-core';
  import { PingController } from './ping.controller';
 
  registerCtl(PingController);
  export const pingController = getCtl<PingController>(PingController);
  ```
  
* 内部控制器引用
  控制器彼此不应产生依赖关系. 因此`injectController`是一个被标记为废弃的方法, 但为了与其他组件统一, 或某些特殊场景, 我们仍然提供了该方法.
