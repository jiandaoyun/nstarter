---
title: "异常管理"
weight: 102
---

## 异常处理

在日志处理的基础上，为了统一对于异常处理的管理，收集统一的错误元数据，框架上统一对相关自定义的异常使用做了规定，一般尽可能使用框架提供的 NsError 来定义自定义对象，以便框架中的工具方法以统一的结构管理收集相关的元数据。

nstarter-core 中包含的异常相关组件如下：

```typescript
import { 
    ErrorBuilder,
    NsError,
    registerErrorMessages
} from 'nstarter-core';
```

`NsError` 对象上存在一些固定的基础信息，可以根据实际应用场景的需要，来选择性使用相关的属性。

```typescript
export class NsError extends Error {
    // nstarter Error 标识
    public readonly isNsError = true;
    // 错误名称
    public readonly name: string;
    // 错误信息
    public readonly message: string;
    // 错误码
    public readonly code: number;
    // 错误级别
    public readonly level: LogLevel;
    // 其他元数据
    public readonly meta: any;
    // http 状态码
    public readonly httpCode: number;
    ...
}
```

一般情况下，自定义 Error 在使用时，可以使用错误码自动匹配出被预先注册好的错误信息，便于复用与统一管理。框架中提供了相关方法，在服务启动过程中，预先对定义好的错误码信息进行注册。

```typescript
import { registerErrorMessages } from 'nstarter-core';

// 定义错误码信息
const messages = {
    101: 'Ops!'
};

// 注册错误消息
registerErrorMessages(messages);
```

目前 nstarter-core 中只提供了框架 Error 对象的基础构造方法，在实际使用过程中，错误可能需要被扩展成各种类型的异常，比如 `UserError` 等。如果使用 nstarter 模板启动项目，可以直接定义 `ErrorTypes` 错误类型枚举，来完成错误类型构造方法的自动注册。

而对于手动使用的场景，可以使用 `ErrorBuilder` 类型来进行相关声明。

```typescript
import { NsError, LogLevel } from 'nstarter-core';

new NsError('User', 101, LogLevel.warn, {});
```
