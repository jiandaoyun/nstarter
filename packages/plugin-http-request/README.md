# nstarter-http-request

HTTP 请求客户端插件，提供 SSRF 防护、日志记录、正向代理等安全特性。

## 核心特性

- 🔒 **SSRF 防护**：DNS/IP 验证，阻止访问内网地址
- 📝 **完善日志**：请求/响应日志记录与过滤
- 🔄 **多适配器**：支持 Axios 和 Undici
- 🌐 **代理支持**：HTTP/HTTPS 正向代理
- ⚡ **重试机制**：可配置的请求重试策略
- 🎯 **类型安全**：完整 TypeScript 类型支持

## 包结构

```
plugin-http-request/
├── src/                           # 源代码目录
│   ├── adapter/                   # HTTP 适配器层
│   │   ├── base.ts                # 适配器基类
│   │   ├── axios.adapter.ts       # Axios 适配器实现
│   │   └── undici.adapter.ts      # Undici 适配器实现
│   ├── security/                  # 安全防护模块
│   │   ├── ssrf.guard.ts          # SSRF 防护核心
│   │   ├── dns.validator.ts       # DNS 验证器（域名解析）
│   │   ├── ip.validator.ts        # IP 地址验证器（私有/保留IP检测）
│   │   └── url.validator.ts       # URL 验证器（黑白名单）
│   ├── logger/                    # 日志记录模块
│   │   ├── base.ts                # 日志记录器基类和接口
│   │   ├── console.logger.ts      # 控制台日志实现
│   │   ├── http_client.logger.ts  # HTTP 客户端专用日志
│   │   └── log.filter.ts          # 日志过滤器（按方法、URL、状态码等）
│   ├── types/                     # TypeScript 类型定义
│   │   ├── config.ts              # 配置相关类型
│   │   ├── request_response.ts    # 请求/响应类型
│   │   ├── security.ts            # 安全相关类型
│   │   ├── logger.ts              # 日志相关类型
│   │   ├── adapter.ts             # 适配器接口类型
│   │   ├── client.ts              # 客户端接口类型
│   │   ├── errors.ts              # 错误类型定义
│   │   └── index.ts               # 类型统一导出
│   ├── utils/                     # 工具函数集
│   │   ├── domain.matcher.ts      # 域名匹配工具（支持完全匹配、后缀匹配）
│   │   ├── ip.range.ts            # IP 范围解析工具（CIDR 支持）
│   │   └── common.ts              # 通用工具函数
│   ├── const/                     # 常量定义
│   │   ├── config.const.ts        # 默认配置常量
│   │   ├── enum.const.ts          # 枚举常量（适配器类型、日志级别）
│   │   └── ip.const.ts            # IP 相关常量（私有IP段、保留IP段）
│   ├── client.ts                  # HTTP 客户端核心类（NsHttpClient）
│   ├── config.ts                  # 配置合并与验证
│   └── index.ts                   # 主入口文件
├── test/                          # 测试文件目录
│   ├── adapter/                   # 适配器测试
│   ├── security/                  # 安全模块测试
│   ├── logger/                    # 日志模块测试
│   ├── utils/                     # 工具函数测试
│   ├── integration/               # 集成测试
│   ├── client.test.ts             # 客户端测试
│   └── config.test.ts             # 配置测试
└── dist/                          # 构建输出目录
    ├── cjs/                       # CommonJS 格式（Node.js require）
    ├── esm/                       # ES Module 格式（import）
    └── types/                     # TypeScript 类型声明文件
```

### 核心模块说明

- **client.ts** - 提供统一的 HTTP 客户端接口，整合适配器、安全防护、日志等功能
- **adapter/** - 适配器模式实现，支持多种 HTTP 库（Axios、Undici），可扩展
- **security/** - SSRF 防护核心，包含 DNS 解析、IP 验证、URL 黑白名单等安全检查
- **logger/** - 可配置的日志系统，支持请求/响应记录、敏感信息过滤、条件日志
- **utils/** - 工具集，包含域名匹配工具（黑白名单、no_proxy）、IP 段解析（CIDR）等辅助功能
- **types/** - 完整的 TypeScript 类型定义，确保类型安全

## 本地开发

```bash
# 在项目根目录安装依赖
npm install

# 构建此包（在根目录执行）
nx build nstarter-http-request

# 运行测试（在根目录执行）
nx test nstarter-http-request

# 代码检查（在根目录执行）
nx eslint nstarter-http-request

# 清理构建产物（在根目录执行）
nx run nstarter-http-request:clean

# 构建所有包
nx run-many -t build

# 测试所有包
nx run-many -t test
```

## 快速开始

### 基础使用

```typescript
import { NsHttpClient, EClientAdapter } from 'nstarter-http-request';

// 创建客户端实例
const client = new NsHttpClient({
  adapter: EClientAdapter.axios,
  security: {
    enableDnsValidation: true,
    enableIpValidation: true,
    allowPrivateIp: false
  }
});

// GET 请求
const response = await client.get('https://api.example.com/users');

// POST 请求
const user = await client.post('https://api.example.com/users', {
  name: 'John',
  email: 'john@example.com'
});
```

### 完整配置示例

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
      'trusted.com', '.trusted.com', // 匹配根域名和所有子域名
      'api.example.com'              // 仅匹配该域名
    ],
    blacklist: [                     // 域名黑名单
      'malicious.com', '.malicious.com', // 根域名和所有子域名
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

### 安全配置详解

#### 1. SSL 证书验证

```typescript
const client = new NsHttpClient({
  security: {
    rejectUnauthorized: true  // 生产环境必须为 true，开发环境可设为 false
  }
});
```

#### 2. SSRF 防护

```typescript
const client = new NsHttpClient({
  security: {
    enableDnsValidation: true,     // 启用 DNS 解析验证
    enableIpValidation: true,      // 启用 IP 地址验证
    allowPrivateIp: false,         // 禁止访问内网 IP（10.x.x.x, 192.168.x.x, 127.x.x.x 等）
    whitelist: [                   // 白名单（支持以下模式）
      'api.example.com',           // 1. 完全匹配
      '.safe.com',                 // 2. 后缀匹配（匹配所有子域名）
      'trusted.com', '.trusted.com' // 3. 组合使用：匹配根域名和所有子域名
    ],
    blacklist: ['malicious.com', '.malicious.com'] // 黑名单：根域名 + 子域名
  }
});
```

**支持的域名模式：**

| 模式 | 匹配规则 | 示例 |
|------|---------|------|
| `example.com` | 完全匹配 | ✅ `example.com`<br>❌ `api.example.com` |
| `.example.com` | 后缀匹配<br>匹配所有子域名（不含根域名） | ❌ `example.com`<br>✅ `api.example.com`<br>✅ `v2.api.example.com`（多级） |
| 组合使用<br>`['example.com', '.example.com']` | 完全匹配 + 后缀匹配<br>匹配根域名和所有子域名 | ✅ `example.com`<br>✅ `api.example.com`<br>✅ `v2.api.example.com`（多级） |

**DNS 缓存机制：**

为提升性能，DNS 解析结果会被缓存。缓存使用 [lru-cache](https://www.npmjs.com/package/lru-cache) 实现，具有以下特性：

- ✅ **TTL 自动过期**：缓存条目到期后自动释放内存
- ✅ **LRU 淘汰策略**：缓存满时自动淘汰最近最少使用的条目
- ✅ **容量限制**：默认最多缓存 500 个域名解析结果
- ✅ **可配置**：支持自定义 TTL 和缓存容量

```typescript
const client = new NsHttpClient({
  security: {
    dnsCacheTtl: 60000,       // 缓存时间：60 秒（默认）
    dnsCacheMaxSize: 500      // 最大缓存条目数（默认）
  }
});
```

### 日志配置详解

#### 1. 自定义日志记录器

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

#### 2. 日志过滤

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

### 正向代理配置

```typescript
const client = new NsHttpClient()
  .withForwardProxy({
    enabled: true,
    http_proxy: 'http://proxy.example.com:8080',
    https_proxy: 'https://proxy.example.com:8443',
    no_proxy: [          // 不使用代理的域名
      'localhost',
      '127.0.0.1',
      '*.internal.com',
      '.local'
    ]
  });
```

### 适配器切换

```typescript
import { EClientAdapter } from 'nstarter-http-request';

// 使用 Axios 适配器（适合通用场景）
const axiosClient = new NsHttpClient().withAdapter(EClientAdapter.axios);

// 使用 Undici 适配器（高性能，Node.js 原生）
const undiciClient = new NsHttpClient().withAdapter(EClientAdapter.undici);
```

