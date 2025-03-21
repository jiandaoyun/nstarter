---
title: "日志处理"
weight: 101
---

## 日志

框架中提供两类基础的日志记录组件，一种是常规的日志记录工具，用于记录一般性的事件消息与异常错误等。另一种是请求日志，用于记录 http 请求中的相关业务，会自动绑定注入请求上下文的关键性信息。

nstarter-core 中可以被引用的日志组件包含：

```typescript
import { 
    LogLevel, 
    Logger,
    RequestLogger, 
    IRequestMeta, 
    IRequestMetaFormatter
} from 'nstarter-core';
```

nstarter-core 的日志组件基于 winston 实现，日志记录的相关输出渠道也采用 winston 的 transport 对象定义。

### 日志级别

在日志管理的过程中，需要通过不同级别来管理不同的日志信息。通过指定策略，可以将不同级别的日志输出到不同的记录渠道。为了简化日志管理，nstarter-core 中目前只提供四个日志级别：

* `debug` - 调试信息记录
* `info` - 常规信息记录
* `warn` - 警告信息，预期内可能出现的中断性异常，或警告信息
* `error` - 错误信息，预期外的异常

相关日志级别可以直接通过常量获取：

```typescript
import { LogLevel } from 'nstarter-core';

let level = Logger.debug;
level = Logger.info;
level = Logger.warn;
level = Logger.error;
```

### 常规日志 (Logger) 

框架中提供的日志组件，主要用于提供统一的入口，对产品业务中的日志/异常记录提供统一的入口。通过调用统一的 `Logger` 组件，统一处理各级别的日志记录行为。`Logger` 对应框架中对日志级别的规定，提供 `debug`, `info`, `warn`, `error` 四个级别的记录方法。

使用示例：

```typescript 
import { Logger } from 'nstarter-core';

Logger.debug('this is a bug');
// 所有日志记录方法都可以额外传入结构灵活的 meta 信息用于补充跟踪信息
Logger.info('Hello World', {
    key: 'value'
});
Logger.warn(err, {});
// 记录方法均同时支持传入文本，或者 Error 对象
Logger.error('Ops!');
Logger.error(err, {});
```

框架中的日志组件仅仅只是提供集中的管理入口，并不直接管理具体对应的日志渠道。所以对外提供了日志记录渠道的注册方法，用于扩展记录渠道。调用示例如下：

```typescript
// 控制台日志记录
const transport = new winston.transports.Console({
    level: consoleLogConf.level,
    stderrLevels: [LogLevel.error],
    consoleWarnLevels: [LogLevel.warn, LogLevel.debug],
    format: format.combine(...formats)
});

Logger.registerTransport(transport);
```

nstarter-core 包中本身并不包含任何默认的 transport 组件，但是通过 nstarter 启动的工程模板支持自动注册相关 transport 类型，包括：

* console - 控制台跟踪记录
* file - 文件记录
* graylog - 通过 GELF 协议集中收集
* sentry - 通过 sentry 记录事件(异常)管理


### 请求日志 (RequestLogger)

在常规日志记录工具以外，因为请求跟踪的需求特殊性，nstarter-core 专门提供了一套请求日志的记录工具。可以针对请求日志的处理，注册与常规日志不同的日志记录渠道，制定不同的日志收集策略。通过这种拆分，请求日志处理起来可以变得更加灵活。

可以通过绑定的提供的工具中间件到路由上，自动完成请求日志的记录。当然，在绑定前仍然需要先完成其他必要的配置。对于 express 下的使用，可以采用如下的方式。

```typescript
import { Router } from 'express';
import { RequestLogger } from 'nstarter-core';

const route = Router();
router.use(RequestLogger.middleware);
```

此外，`RequestLogger` 上也提供了可以用于直接记录请求中异常的工具方法，用于在特定的中间件中捕获请求错误。

```typescript
RequestLogger.logError(LogLevel.warn, err, {});
```

在请求额外元数据的处理上，nstarter-core 提供的方法会自动从请求上下文的 `Request` 与 `Response` 对象上采集如下的信息。

```typescript
{
    // 请求路径
    path: string;
    // 请求 IP 地址
    ip: string;
    // 请求体内容
    body: any;
    // querystring 参数
    query: any;
    // 请求时间
    duration: string;
    // 请求状态码
    status: number;
    // 请求 HTTP 动词
    method: string;
    // 请求来源 UA
    user_agent?: string;
    // 请求 ID
    request_id?: string;
    // HTTP 协议版本
    http_version: string;
}
```

当然，框架中提供的元数据采集往往只能满足基本的业务信息采集需要，在实际工程使用中，往往需要添加额外的采集逻辑，比如要获取用户名等。因此，nstarter-core 也开放了相关的接口，用于注册自定义的结构定义方法。

```typescript
import { IRequestMetaFormatter, RequestLogger } from 'nstarter-core';

// 定义请求元数据采集方法
const reqMetaFormatter: IRequestMetaFormatter = (req, res, meta) => {
    const user = req.user;
    if (user) {
        // 可以根据实际需要
        return {
            ...meta,
            username: user.username
        };
    } else {
        return meta;
    }
};

// 注册元数据采集方法
RequestLogger.setMetaFormatter(reqMetaFormatter);
```

需要注意的是，由于请求业务中可能会带有用户密码等敏感信息，相关内容如果被明文采集记录会带来潜在的安全性隐患，一般在元数据采集过程中，也应该针对特定的敏感内容补充对应处理规则。

与常规日志记录类似，因为 nstarter-core 中没有提供默认 transport，所以请求日志同样提供记录渠道的记录方法。

```typescript
Logger.registerTransport(transport);
```
