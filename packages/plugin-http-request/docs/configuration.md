# 完整配置示例

以下是一个包含所有配置选项的完整示例：

```typescript
import { NsHttpClient, EClientAdapter } from 'nstarter-http-request';

const client = new NsHttpClient({
  // 适配器配置
  adapter: EClientAdapter.axios,

  // 安全配置
  security: {
    rejectUnauthorized: true,        // 是否验证 SSL 证书（生产环境建议 true）
    enableDnsValidation: true,       // 开启 DNS 验证
    enableIpValidation: true,        // 开启 IP 验证
    allowPrivateIp: false,           // 是否允许访问私有 IP（内网地址）
    whitelist: [                     // 域名白名单
      'trusted.com', '*.trusted.com', // 匹配根域名和一级子域名
      'api.example.com'               // 仅匹配该域名
    ],
    blacklist: [                     // 域名黑名单
      'malicious.com', '*.malicious.com', // 根域名和一级子域名
      'unsafe.net'
    ],
    dnsCacheTtl: 60000,              // DNS 缓存 TTL（毫秒，默认 60 秒）
    dnsCacheMaxSize: 500             // DNS 缓存最大条目数（默认 500，使用 LRU 淘汰策略）
  },

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
      onlySuccess: false,            // 是否只记录成功请求
      minDuration: 100,              // 只记录耗时超过指定毫秒的请求
      customFilter: (options) => {   // 自定义过滤函数
        return options.request.method === 'POST';
      }
    }
  },

  // 请求配置
  request: {
    timeout: 30000,                  // 请求超时（毫秒，默认 30 秒）
    retries: 3,                      // 重试次数（默认 0）
    retryDelay: 1000,                // 重试延迟（毫秒，默认 1 秒）
    maxRedirects: 5,                 // 最大重定向次数（默认 5）
    maxRequestBodySize: 10 * 1024 * 1024,   // 最大请求体大小（字节，默认 10MB）
    maxResponseBodySize: 50 * 1024 * 1024,  // 最大响应体大小（字节，默认 50MB）
    proxy: {                         // HTTP 代理配置（可选，不同于正向代理）
      host: 'proxy.example.com',
      port: 8080,
      protocol: 'http',              // 'http' | 'https'
      auth: {                        // 代理认证（可选）
        username: 'user',
        password: 'pass'
      }
    }
  }
});
```

## 配置说明

### 适配器配置

- `adapter`: 指定使用的 HTTP 客户端适配器，可选值：`EClientAdapter.axios` 或 `EClientAdapter.undici`

### 安全配置

详细说明请参考 [安全配置文档](./security.md)

### 日志配置

详细说明请参考 [日志配置文档](./logging.md)

### 请求配置

- `timeout`: 请求超时时间（毫秒）
- `retries`: 请求失败时的重试次数
- `retryDelay`: 重试延迟时间（毫秒）
- `maxRedirects`: 最大重定向次数
- `maxRequestBodySize`: 最大请求体大小限制（字节）
- `maxResponseBodySize`: 最大响应体大小限制（字节）
- `proxy`: HTTP 代理配置（注意：这与正向代理不同，详见 [代理配置文档](./proxy.md)）

