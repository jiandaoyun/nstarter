# nstarter-core 组件说明

为了方便框架中各通用的工具组件可以被灵活的在各项目中被引用，并且可以被快速更新维护，统一将相关涉及到的工具性组件整合到 nstarter-core 中作为框架核心模块依赖使用。

框架核心模块中提供的组件包括以下部分：

```typescript
import { 
    // 日志
    LogLevel, 
    Logger,
    RequestLogger, 
    IRequestMeta, 
    IRequestMetaFormatter,

    // 异常处理
    ErrorBuilder,
    NsError,
    registerErrorMessages,

    // 组件管理
    component,
    injectComponent,
    registerComponent,
    getComponent,

    // 控制器管理
    controller,
    injectController,
    registerController,
    getController,

    // 服务管理
    service,
    injectService,
    registerSvc,
    getSvc,

    // 运行环境
    RunEnv
} from 'nstarter-core';
```

下面的具体章节，会对框架核心模块中所提供的组件与工具方法进行简单的说明。

* [日志](01.logs.md)
* [异常处理](02.exceptions.md)
* [组件管理](03.components.md)
* [控制器管理](04.controllers.md)
* [服务管理](05.services.md)
* [运行环境](06.environment.md)
