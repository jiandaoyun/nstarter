---
title: "路由控制器"
weight: 10
---

## 路由和控制器

nstarter 中路由与控制器属于数据的展现层，负责控制连接后台业务与前台交互。控制器直接处理用户端输入的数据，同时也负责对返回结果的结构整理。路由负责管理调度控制器，分发用户请求。


### 路由 (Router)

nstarter-express 的路由采用 express router 进行路径挂载定义。为了方便管理资源请求路径，通过将路径管理集中注册，避免在规模较大的项目中产生路径冲突以及其他维护性问题。因为当出现同一个工程中，有数百个请求的控制器方法分散在各处时，会产生非常麻烦的维护问题。

主路由表定义在 `src/routes/index.ts`。如果工程规模较为庞大，可以考虑对请求路径进行分层规划设计，拆分成多个不同模块的路由表进行路由绑定管理，最后再从顶层将各个子模块路由定义组织到一起。子路由的定义同样可以统一放在 `src/routes` 目录下。

```typescript
export const requestRouter = Router();

requestRouter.post('/ping', DemoController.doPing);
requestRouter.use(ErrorHandler.requestErrorHandler);

export const viewRouter = Router();

viewRouter.get('/', DemoController.goWelcomeView);
viewRouter.get('/error', DemoController.goErrorView);
viewRouter.use(ErrorHandler.viewErrorHandler);

// 主路由
export const router = Router();
router.use('/', viewRouter);
router.use('/', requestRouter);
```

路由绑定因为采用了直接人工申明的方式，所以很容易可以实现将统一控制器方法绑定到不同的路由路径上。


### 控制器 (Controller)

控制器负责服务业务逻辑与外部数据输入输出的结构对接。例如，对于 API 场景控制器负责面向用户处理输入/返回的数据，对于页面访问场景，控制器负责渲染返回 html 页面。

控制器方法，一般仅简单处理加工将内部业务的数据结构转换为外部需要的结构，或将外部输入处理为内部规范的数据结构。控制器方法中不应该处理业务层的复杂逻辑，而将业务部分交由具体的业务层服务来实现。

控制器方法默认统一放置在 `src/controller` 目录下。推荐使用 nstarter-core 框架提供的 `controller` 装饰器，同时支持同步与异步的路由方法实现，并提供标准化的异常处理。

```typescript
import { controller } from 'nstarter-core';
import { Request, Response } from 'express';

@controller()
export class DemoController {
    // GET 请求页面渲染
    public async goWelcomeView(req: Request, res: Response) {
        const { params } = req;
        return res.render('welcome', {
            title: 'To Infinity and Beyond!'
        });
    };
    
    // 错误处理
    public async goErrorView(req: Request, res: Response) {
        const { params } = req;
        throw Errors.user(1001);
    };

    // POST 请求 JSON 数据返回
    public async doPing(req: Request, res: Response) {
        const { body } = req;
        return res.json({ 'msg': 'pong' });
    }
}
```

nstarter-express 中没有采用类似其他框架那样，将路由配置通过装饰器实现后，统一把控制器方法与路由定义组合在一起的方案。两种方式各有利弊，对于可能涉及到的大型项目，推荐目前的拆分形式便于管理。


### 路由中间件 (Middleware)

如果在路由上仅仅只关联控制器方法，还无法满足一部分需要在不同业务上复用的处理逻辑定义。所以提供了路由中间件，来处理相关业务，例如请求上下文的统一元数据处理，统一的鉴权逻辑，以及控制器处理后的异常处理等场景。

路由中间件属于路由的一部分，定义在 `src/routes/middlewares` 路径下，例如对于请求异常的处理，可以采用如下的方式进行定义。

```typescript
public static requestErrorHandler: ErrorRequestHandler = ((err, req, res, next) => {
    if (err && !err.isCustomError) {
        return res.status(httpStatus.BAD_REQUEST);
    }
    return res.status(httpStatus.BAD_REQUEST).json({
        error: err.message
    });
});
```

另外，对于中间件方法，允许其像控制器一样来调用业务层提供的方法，而不是在中间件方法实现过程中，完全自己管理内部业务，以便于相同逻辑的复用。

在其他框架中，还可以看到一种比较常见的通过装饰器来定义中间件方法进行复用的逻辑。不过对于业务上的中间件，考虑到装饰器本身会导致代码可读性变差，所以 nstater 不采用此种方式。
