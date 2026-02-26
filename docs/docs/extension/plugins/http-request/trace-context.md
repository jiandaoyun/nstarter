---
title: "W3C Trace Context"
sidebar_position: 7
---

# W3C Trace Context 支持

本 HTTP 客户端完全支持 [W3C Trace Context](https://www.w3.org/TR/trace-context/) 规范，允许你在分布式系统中进行跨服务的链路追踪。

## 什么是 Trace Context？

W3C Trace Context 定义了标准的 HTTP 头格式，用于在分布式系统中传播追踪上下文信息。核心是 `traceparent` 头，格式如下：

```
traceparent: version-trace-id-parent-id-trace-flags
```

例如：
```
traceparent: 00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01
```

其中：
- `version`（2位）：当前固定为 `00`
- `trace-id`（32位十六进制）：唯一标识整个追踪链路
- `parent-id`（16位十六进制）：唯一标识当前 span/操作
- `trace-flags`（2位十六进制）：标志位，`01` 表示已采样，`00` 表示未采样

## 基础使用

### 1. 在请求中传递 traceparent

```typescript
import { NsHttpClient, TraceContext } from 'nstarter-http-request';

const client = new NsHttpClient();

// 生成新的 traceparent
const traceparent = TraceContext.generate();

// 在请求中使用
const response = await client.get('https://api.example.com/users', {
    traceparent
});
```

### 2. 传播现有的 traceparent

在微服务架构中，你通常需要从上游服务接收 traceparent 并传递给下游服务：

```typescript
// 从上游请求中获取 traceparent
const incomingTraceparent = request.headers.traceparent;

// 创建子 span 并传递给下游服务
const childTraceparent = TraceContext.createChild(incomingTraceparent);

const response = await client.post('https://downstream-service.com/api', data, {
    traceparent: childTraceparent
});
```

### 3. 自定义 traceparent 生成

```typescript
// 生成未采样的 traceparent
const unsampled = TraceContext.generate({ sampled: false });

// 使用自定义的 trace ID
const customTrace = TraceContext.generate({
    traceId: '0af7651916cd43dd8448eb211c80319c',
    sampled: true
});
```

## TraceContext 工具类

`TraceContext` 类提供了完整的工具方法来处理 W3C Trace Context：

### 生成方法

```typescript
// 生成新的 traceparent
const traceparent = TraceContext.generate({
    traceId?: string,    // 可选，自定义 trace ID
    parentId?: string,   // 可选，自定义 parent/span ID
    sampled?: boolean    // 可选，是否采样，默认 true
});

// 生成 trace ID（32位十六进制）
const traceId = TraceContext.generateTraceId();

// 生成 span ID（16位十六进制）
const spanId = TraceContext.generateSpanId();
```

### 解析和验证

```typescript
// 解析 traceparent
const parsed = TraceContext.parse('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01');
// 返回：
// {
//   version: '00',
//   traceId: '0af7651916cd43dd8448eb211c80319c',
//   parentId: 'b7ad6b7169203331',
//   traceFlags: '01'
// }

// 验证 traceparent 是否有效
const isValid = TraceContext.isValid('00-...-...-01'); // true or false

// 验证 trace ID
const isValidTraceId = TraceContext.isValidTraceId('0af7651916cd43dd8448eb211c80319c');

// 验证 span ID
const isValidSpanId = TraceContext.isValidSpanId('b7ad6b7169203331');
```

### 创建子 Span

```typescript
// 从父 traceparent 创建子 span
const parentTraceparent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';
const childTraceparent = TraceContext.createChild(parentTraceparent);

// 子 span 会继承父 span 的 trace ID 和采样决策
// 但会生成新的 span ID

// 覆盖采样决策
const unsampledChild = TraceContext.createChild(parentTraceparent, false);
```

### 检查采样状态

```typescript
// 检查 traceparent 是否已采样
const sampled = TraceContext.isSampled('00-...-...-01'); // true
const notSampled = TraceContext.isSampled('00-...-...-00'); // false
```

## 完整示例：微服务链路追踪

### 服务 A（入口服务）

```typescript
import express from 'express';
import { NsHttpClient, TraceContext } from 'nstarter-http-request';

const app = express();
const client = new NsHttpClient();

app.get('/api/users/:id', async (req, res) => {
    // 检查是否有上游的 traceparent
    let traceparent = req.headers.traceparent as string;
    
    // 如果没有，生成新的
    if (!traceparent || !TraceContext.isValid(traceparent)) {
        traceparent = TraceContext.generate();
        console.log('生成新的 trace:', traceparent);
    }
    
    // 创建子 span 调用服务 B
    const childTraceparent = TraceContext.createChild(traceparent);
    
    try {
        const userResponse = await client.get(
            `https://service-b.com/users/${req.params.id}`,
            { traceparent: childTraceparent }
        );
        
        res.json(userResponse.data);
    } catch (error) {
        console.error('Error with trace:', traceparent);
        res.status(500).json({ error: 'Internal error' });
    }
});
```

### 服务 B（中间服务）

```typescript
import express from 'express';
import { NsHttpClient, TraceContext } from 'nstarter-http-request';

const app = express();
const client = new NsHttpClient();

app.get('/users/:id', async (req, res) => {
    // 接收上游的 traceparent
    const incomingTraceparent = req.headers.traceparent as string;
    
    if (!TraceContext.isValid(incomingTraceparent)) {
        return res.status(400).json({ error: 'Invalid traceparent' });
    }
    
    const parsed = TraceContext.parse(incomingTraceparent);
    console.log('处理 trace:', parsed?.traceId);
    
    // 创建子 span 调用服务 C
    const childTraceparent = TraceContext.createChild(incomingTraceparent);
    
    const ordersResponse = await client.get(
        `https://service-c.com/orders?userId=${req.params.id}`,
        { traceparent: childTraceparent }
    );
    
    res.json({
        user: { id: req.params.id },
        orders: ordersResponse.data
    });
});
```

### 服务 C（下游服务）

```typescript
import express from 'express';
import { TraceContext } from 'nstarter-http-request';

const app = express();

app.get('/orders', async (req, res) => {
    // 接收上游的 traceparent
    const traceparent = req.headers.traceparent as string;
    
    if (TraceContext.isValid(traceparent)) {
        const parsed = TraceContext.parse(traceparent);
        console.log('查询订单，trace:', parsed?.traceId);
        console.log('当前 span:', parsed?.parentId);
        console.log('已采样:', TraceContext.isSampled(traceparent));
    }
    
    // 执行业务逻辑
    const orders = await getOrdersByUserId(req.query.userId);
    
    res.json(orders);
});
```

## 与追踪系统集成

### 与 OpenTelemetry 集成

```typescript
import { trace } from '@opentelemetry/api';
import { NsHttpClient, TraceContext } from 'nstarter-http-request';

const tracer = trace.getTracer('my-service');
const client = new NsHttpClient();

async function makeTracedRequest() {
    return tracer.startActiveSpan('http-request', async (span) => {
        // 从 OpenTelemetry span 获取 trace context
        const spanContext = span.spanContext();
        const traceId = spanContext.traceId;
        const spanId = spanContext.spanId;
        const traceFlags = spanContext.traceFlags.toString(16).padStart(2, '0');
        
        // 生成 W3C traceparent
        const traceparent = `00-${traceId}-${spanId}-${traceFlags}`;
        
        try {
            const response = await client.get('https://api.example.com/data', {
                traceparent
            });
            
            span.setStatus({ code: SpanStatusCode.OK });
            return response.data;
        } catch (error) {
            span.setStatus({ 
                code: SpanStatusCode.ERROR,
                message: error.message 
            });
            throw error;
        } finally {
            span.end();
        }
    });
}
```

### 日志关联

```typescript
import { NsHttpClient, TraceContext } from 'nstarter-http-request';

const client = new NsHttpClient();

async function makeRequestWithLogging() {
    const traceparent = TraceContext.generate();
    const parsed = TraceContext.parse(traceparent);
    
    // 在日志中包含 trace ID，方便日志聚合和查询
    console.log({
        message: 'Making API request',
        traceId: parsed?.traceId,
        spanId: parsed?.parentId,
        timestamp: new Date().toISOString()
    });
    
    const response = await client.get('https://api.example.com/data', {
        traceparent
    });
    
    console.log({
        message: 'API request completed',
        traceId: parsed?.traceId,
        spanId: parsed?.parentId,
        status: response.status,
        timestamp: new Date().toISOString()
    });
    
    return response.data;
}
```

## 最佳实践

### 1. 始终验证 traceparent

```typescript
const traceparent = req.headers.traceparent as string;

if (traceparent && TraceContext.isValid(traceparent)) {
    // 使用有效的 traceparent
} else {
    // 生成新的或记录警告
}
```

### 2. 创建子 span 而不是重用

```typescript
// ✅ 正确：创建子 span
const childTraceparent = TraceContext.createChild(incomingTraceparent);
await client.get(url, { traceparent: childTraceparent });

// ❌ 错误：直接重用父 span
await client.get(url, { traceparent: incomingTraceparent });
```

### 3. 在日志中包含 trace 信息

```typescript
const parsed = TraceContext.parse(traceparent);
logger.info('Processing request', {
    traceId: parsed?.traceId,
    spanId: parsed?.parentId,
    // 其他日志信息
});
```

### 4. 采样策略

```typescript
// 根据业务需求决定是否采样
const shouldSample = Math.random() < 0.1; // 10% 采样率

const traceparent = TraceContext.generate({
    sampled: shouldSample
});

// 或者基于特定条件
const traceparent = TraceContext.generate({
    sampled: request.path.includes('/api/critical')
});
```

### 5. 错误处理

```typescript
try {
    await client.get(url, { traceparent });
} catch (error) {
    // 在错误日志中包含 trace 信息，便于追踪问题
    const parsed = TraceContext.parse(traceparent);
    logger.error('Request failed', {
        error: error.message,
        traceId: parsed?.traceId,
        spanId: parsed?.parentId
    });
    throw error;
}
```

## 规范参考

- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [W3C Trace Context Level 2](https://www.w3.org/TR/trace-context-2/)

## API 文档

### TraceContext

完整的 API 文档：

```typescript
class TraceContext {
    // 生成 traceparent
    static generate(options?: TraceParentOptions): string;
    
    // 解析 traceparent
    static parse(traceparent: string): TraceParent | null;
    
    // 验证 traceparent
    static isValid(traceparent: string): boolean;
    
    // 创建子 span
    static createChild(parentTraceparent: string, sampled?: boolean): string;
    
    // 检查是否采样
    static isSampled(traceparent: string): boolean;
    
    // 生成 trace ID
    static generateTraceId(): string;
    
    // 生成 span ID
    static generateSpanId(): string;
    
    // 验证 trace ID
    static isValidTraceId(traceId: string): boolean;
    
    // 验证 span ID
    static isValidSpanId(spanId: string): boolean;
}

interface TraceParentOptions {
    traceId?: string;    // 自定义 trace ID（32位十六进制）
    parentId?: string;   // 自定义 parent ID（16位十六进制）
    sampled?: boolean;   // 是否采样，默认 true
}

interface TraceParent {
    version: string;     // 版本号，当前为 '00'
    traceId: string;     // Trace ID（32位十六进制）
    parentId: string;    // Parent/Span ID（16位十六进制）
    traceFlags: string;  // Trace 标志位（2位十六进制）
}
```
