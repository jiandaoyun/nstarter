# 日志配置详解

## 自定义日志记录器

```typescript
import { ILogger } from 'nstarter-http-request';

const customLogger: ILogger = {
  debug: (msg, meta) => console.debug(msg, meta),
  info: (msg, meta) => console.info(msg, meta),
  warn: (msg, meta) => console.warn(msg, meta),
  error: (msg, meta) => console.error(msg, meta)
};

const client = new NsHttpClient({
  logging: { logger: customLogger }
});
```

## 日志过滤

```typescript
const client = new NsHttpClient({
  logging: {
    enabled: true,
    filter: {
      // 只记录失败的 POST 请求
      methods: ['POST'],
      onlyFailed: true,
      minDuration: 1000  // 且耗时超过 1 秒
    }
  }
});
```

## 完整日志配置示例

```typescript
const client = new NsHttpClient({
  // 日志配置
  logging: {
    enabled: true,                   // 是否启用日志
    logRequestBody: true,            // 是否记录请求体
    logResponseBody: true,           // 是否记录响应体
    bodyMaxLength: 1024 * 1024,      // 请求/响应体最大记录长度（字节，默认 1MB）
    logger: customLogger,            // 自定义日志记录器（可选，实现 ILogger 接口）
    httpLogger: customHttpLogger,    // 自定义 HTTP 日志记录器（可选，实现 IHttpClientLogger 接口）
    filter: {                        // 日志过滤配置
      methods: ['POST', 'PUT'],      // 只记录指定 HTTP 方法
      urlPatterns: [                 // 只记录匹配的 URL（支持正则）
        /\/api\//,
        'https://api.example.com'
      ],
      scenarios: ['payment'],        // 只记录指定业务场景
      statusCodes: [404, 500],       // 只记录指定状态码
      statusCodeRanges: [            // 只记录指定状态码范围
        { min: 400, max: 499 },      // 客户端错误
        { min: 500, max: 599 }       // 服务端错误
      ],
      onlyFailed: false,             // 是否只记录失败请求
      onlySuccess: false,             // 是否只记录成功请求
      minDuration: 100,              // 只记录耗时超过指定毫秒的请求
      customFilter: (options) => {   // 自定义过滤函数
        return options.request.method === 'POST';
      }
    }
  }
});
```

