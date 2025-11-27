# nstarter-http-request

`nstarter HTTP` 请求客户端插件，提供安全、可靠、易用的 HTTP 请求能力。

## 特性

### 🚀 核心功能

- **多适配器支持**：支持 Axios 和 Undici 两种适配器，可根据需求灵活切换
- **统一接口**：无论使用哪种适配器，都提供统一的请求/响应接口
- **自动重试**：支持配置自动重试次数和延迟
- **超时控制**：灵活的超时配置
- **代理支持**：支持正向代理配置

### 🔒 安全防护

- **SSRF 防护**：防止服务器端请求伪造攻击
- **IP 地址验证**：阻止访问私有 IP、回环地址、Link-Local 地址等
- **DNS 解析验证**：验证 DNS 解析结果.
- **DNS 缓存**：带 TTL 的 DNS 缓存，提高性能并增强安全性
- **黑白名单**：支持域名黑白名单（支持通配符，如 `*.example.com`）

### 📊 日志记录

- **可插拔日志适配器**：支持自定义日志记录器
- **详细的请求/响应日志**：记录完整的请求和响应信息
- **业务场景标识**：支持为不同业务场景添加标识
- **灵活配置**：可配置日志级别、内容过滤

### 🧪 测试

- 完整的单元测试覆盖

## 安装

```bash
npm install nstarter-http-request
```

根据需要安装适配器依赖：

```bash
# 使用 Axios 适配器
npm install axios

# 使用 Undici 适配器
npm install undici
```

## 快速开始

### 基础使用

```typescript
import {
    HttpClient,
    EClientAdapter
} from 'nstarter-http-request';

// 创建客户端实例
const client = new HttpClient({
    adapter: EClientAdapter.undici, // 或 EClientAdapter.axios
    request: {
        timeout: 5000,
        retries: 3
    }
});

// 发送 GET 请求
const response = await client.get('https://api.example.com/data');
console.log(response.data);

// 发送 POST 请求
const postResponse = await client.post(
    'https://api.example.com/users',
    { name: 'John', email: 'john@example.com' }
);
```

### 使用便捷方法

```typescript
// GET 请求
const getData = await client.get('https://api.example.com/data');

// POST 请求
const postData = await client.post('https://api.example.com/users', {
    name: 'John'
});

// PUT 请求
const putData = await client.put('https://api.example.com/users/1', {
    name: 'Jane'
});

// DELETE 请求
const deleteData = await client.delete('https://api.example.com/users/1');

// PATCH 请求
const patchData = await client.patch('https://api.example.com/users/1', {
    email: 'newemail@example.com'
});
```

### 通用请求方法

```typescript
const response = await client.request({
    method: 'GET',
    url: 'https://api.example.com/data',
    headers: {
        'Authorization': 'Bearer token123'
    },
    params: {
        page: 1,
        limit: 10
    },
    scenario: 'user-management', // 业务场景标识
    meta: {
        userId: '123' // 自定义元数据
    }
});
```

## 配置选项

### 完整配置示例

```typescript
import {
    HttpClient,
    EClientAdapter
} from 'nstarter-http-request';

const client = new HttpClient({
    // 适配器配置
    adapter: EClientAdapter.undici,

    // 请求配置
    request: {
        timeout: 5000,              // 超时时间（毫秒）
        retries: 3,                 // 重试次数
        retryDelay: 1000,           // 重试延迟（毫秒）
        maxRedirects: 5,            // 最大重定向次数
        maxRequestBodySize: 10485760,  // 最大请求体大小（10MB）
        maxResponseBodySize: 10485760  // 最大响应体大小（10MB）
    },

    // 安全配置
    security: {
        rejectUnauthorized: true,   // 证书校验
        enableDnsValidation: true,  // 启用 DNS 验证
        enableIpValidation: true,   // 启用 IP 验证
        allowPrivateIp: false,      // 是否允许访问私有 IP
        whitelist: ['*.example.com'], // 域名白名单
        blacklist: ['*.blocked.com'], // 域名黑名单
        dnsCacheTtl: 300000         // DNS 缓存 TTL（5分钟）
    },

    // 日志配置
    logging: {
        enabled: true,              // 启用日志
        logRequestBody: true,       // 记录请求体
        logResponseBody: true,      // 记录响应体
        bodyMaxLength: 1000,        // 响应体最大记录长度
        filter: {
            // 日志过滤配置（可选）
            methods: ['POST', 'PUT'],           // 只记录 POST 和 PUT 请求
            scenarios: ['user-management'],     // 只记录特定场景
            minDuration: 1000,                  // 只记录耗时超过 1 秒的请求
            onlyFailed: false                   // 记录所有请求（成功和失败）
        }
    }
});
```

### 安全配置详解

#### IP 验证

默认情况下，客户端会阻止访问以下 IP 地址：

- 私有 IP 地址
- 回环地址
- Link-Local 地址
- 多播地址
- 广播地址

```typescript
// 允许访问私有 IP
const client = new HttpClient({
    security: {
        allowPrivateIp: true
    }
});
```

#### 域名黑白名单

支持使用通配符配置域名黑白名单：

```typescript
const client = new HttpClient({
    security: {
        // 只允许访问这些域名
        whitelist: [
            'api.example.com',
            '*.trusted.com',
            'service.*.example.com'
        ],
        // 禁止访问这些域名
        blacklist: [
            '*.malicious.com',
            'dangerous.example.com'
        ]
    }
});
```

#### DNS 验证和缓存

DNS 验证可以防止 DNS 重绑定攻击：

```typescript
const client = new HttpClient({
    security: {
        enableDnsValidation: true,  // 启用 DNS 验证
        dnsCacheTtl: 300000         // DNS 缓存 5 分钟
    }
});

// 手动清空 DNS 缓存
client.clearDnsCache();

// 获取 DNS 缓存大小
const cacheSize = client.getDnsCacheSize();
```

### 日志配置

#### 使用内置日志

```typescript
const client = new HttpClient({
    logging: {
        enabled: true,
        logRequestBody: true,
        logResponseBody: true,
        bodyMaxLength: 1000
    }
});
```

#### 使用自定义日志记录器

```typescript
import type { ILogger } from 'nstarter-http-request';

class MyLogger implements ILogger {
    debug(message: string, meta?: any): void {
        console.log('[DEBUG]', message, meta);
    }

    info(message: string, meta?: any): void {
        console.log('[INFO]', message, meta);
    }

    warn(message: string, meta?: any): void {
        console.warn('[WARN]', message, meta);
    }

    error(message: string, meta?: any): void {
        console.error('[ERROR]', message, meta);
    }
}

const client = new HttpClient({
    logging: {
        enabled: true,
        logger: new MyLogger()
    }
});
```

#### 使用自定义 HTTP 日志记录器

```typescript
import type {
    IHttpClientLogger,
    HttpLogContext
} from 'nstarter-http-request';

class MyHttpLogger implements IHttpClientLogger {
    logSuccess(context: HttpLogContext): void {
        console.log('Request succeeded:', {
            url: context.request.url,
            status: context.response?.status,
            duration: context.duration
        });
    }

    logFailed(context: HttpLogContext): void {
        console.error('Request failed:', {
            url: context.request.url,
            error: context.error?.message,
            duration: context.duration
        });
    }
}

const client = new HttpClient({
    logging: {
        enabled: true,
        httpLogger: new MyHttpLogger()
    }
});
```

#### 日志过滤

日志过滤器用于控制记录哪些请求日志：

```typescript
const client = new HttpClient({
    logging: {
        enabled: true,
        filter: {
            // 只记录 POST 和 PUT 请求
            methods: ['POST', 'PUT'],

            // 只记录特定 URL 模式
            urlPatterns: ['/api/users', /\/api\/orders\/\d+/],

            // 只记录特定业务场景
            scenarios: ['user-registration', 'order-payment'],

            // 只记录 4xx 和 5xx 错误
            statusCodeRanges: [
                { min: 400, max: 499 },
                { min: 500, max: 599 }
            ],

            // 只记录失败的请求
            onlyFailed: true,

            // 只记录耗时超过 1 秒的请求
            minDuration: 1000,

            // 自定义过滤函数
            customFilter: (context) => {
                // 只记录生产环境的错误
                return process.env.NODE_ENV === 'production' && !context.isSuccess;
            }
        }
    }
});
```

### 代理配置

#### 正向代理

```typescript
import type { IForwardProxy } from 'nstarter-http-request';

const proxy: IForwardProxy = {
    enabled: true,
    http_proxy: 'http://proxy.example.com:8080',
    https_proxy: 'http://proxy.example.com:8080',
    no_proxy: ['localhost', '*.internal.com']
};

const client = new HttpClient();
client.withForwardProxy(proxy);
```

## 高级用法

### 切换适配器

```typescript
const client = new HttpClient({
    adapter: EClientAdapter.axios
});

// 动态切换到 Undici 适配器
client.withAdapter(EClientAdapter.undici);
```

### 业务场景标识

为不同的业务场景添加标识，便于日志追踪和统计：

```typescript
// 用户管理场景
await client.get('https://api.example.com/users', {
    scenario: 'user-management',
    meta: {
        action: 'list-users',
        adminId: '123'
    }
});

// 订单处理场景
await client.post('https://api.example.com/orders', orderData, {
    scenario: 'order-processing',
    meta: {
        orderId: 'ORD-001',
        userId: 'USER-123'
    }
});
```

### 请求重试

```typescript
// 使用默认重试配置
const client = new HttpClient({
    request: {
        retries: 3,
        retryDelay: 1000
    }
});

// 为特定请求自定义重试
await client.get('https://api.example.com/data', {
    retries: 5,
    retryDelay: 2000
});
```

### 自定义请求头

```typescript
await client.get('https://api.example.com/data', {
    headers: {
        'Authorization': 'Bearer token123',
        'X-Custom-Header': 'custom-value',
        'User-Agent': 'MyApp/1.0'
    }
});
```

### 查询参数

```typescript
await client.get('https://api.example.com/users', {
    params: {
        page: 1,
        limit: 20,
        sort: 'name',
        filter: 'active'
    }
});
// 实际请求 URL: https://api.example.com/users?page=1&limit=20&sort=name&filter=active
```

### 请求体

```typescript
// JSON 请求体
await client.post('https://api.example.com/users', {
    name: 'John',
    email: 'john@example.com'
}, {
    headers: {
        'Content-Type': 'application/json'
    }
});

// Form 请求体
await client.post('https://api.example.com/upload', formData, {
    headers: {
        'Content-Type': 'multipart/form-data'
    }
});
```

## 错误处理

```typescript
import {
    HttpError,
    SecurityError
} from 'nstarter-http-request';

try {
    const response = await client.get('https://api.example.com/data');
    console.log(response.data);
} catch (error) {
    if (error instanceof SecurityError) {
        // 安全相关错误（SSRF、IP 验证失败等）
        console.error('Security error:', error.message);
    } else if (error instanceof HttpError) {
        // HTTP 请求错误
        console.error('HTTP error:', {
            status: error.status,
            code: error.code,
            message: error.message,
            response: error.response
        });
    } else {
        // 其他错误
        console.error('Unknown error:', error);
    }
}
```

### 类型定义

#### HttpRequestOptions

```typescript
interface HttpRequestOptions {
    method: string;           // HTTP 方法
    url: string;              // 请求 URL
    headers?: Record<string, string>;  // 请求头
    params?: Record<string, any>;      // 查询参数
    body?: any;               // 请求体
    timeout?: number;         // 超时时间
    retries?: number;         // 重试次数
    retryDelay?: number;      // 重试延迟
    scenario?: string;        // 业务场景标识
    meta?: Record<string, any>;  // 自定义元数据
}
```

#### HttpResponse

```typescript
interface HttpResponse<T = any> {
    status: number;           // HTTP 状态码
    statusText: string;       // 状态文本
    headers: Record<string, string>;  // 响应头
    data: T;                  // 响应数据
}
```

## 最佳实践

### 1. 使用单例模式

```typescript
// httpClient.ts
import {
    HttpClient,
    EClientAdapter
} from 'nstarter-http-request';

export const httpClient = new HttpClient({
    adapter: EClientAdapter.undici,
    request: {
        timeout: 5000,
        retries: 3
    },
    security: {
        enableDnsValidation: true,
        enableIpValidation: true
    }
});
```

### 2. 为不同服务创建专用客户端

```typescript
// userService.ts
const userApiClient = new HttpClient({
    request: { timeout: 3000 },
    security: { whitelist: ['api.user-service.com'] }
});

// orderService.ts
const orderApiClient = new HttpClient({
    request: { timeout: 5000 },
    security: { whitelist: ['api.order-service.com'] }
});
```

### 3. 合理配置安全选项

```typescript
// 生产环境
const prodClient = new HttpClient({
    security: {
        enableDnsValidation: true,
        enableIpValidation: true,
        allowPrivateIp: false,
        whitelist: ['*.trusted-api.com']
    }
});

// 开发环境
const devClient = new HttpClient({
    security: {
        allowPrivateIp: true,  // 允许访问本地服务
        enableIpValidation: false
    }
});
```

### 4. 使用业务场景标识

```typescript
await client.post('/api/users', userData, {
    scenario: 'user-registration',
    meta: {
        source: 'web',
        version: 'v2'
    }
});
```

### 5. 错误处理和重试

```typescript
const client = new HttpClient({
    request: {
        retries: 3,
        retryDelay: 1000
    }
});

try {
    const response = await client.get(url);
    return response.data;
} catch (error) {
    // 处理错误，记录日志
    logger.error('Request failed after retries', error);
    throw error;
}
```

