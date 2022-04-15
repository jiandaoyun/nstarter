---
title: "业务上下文 (Context)"
weight: 104
---

# 业务上下文 

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