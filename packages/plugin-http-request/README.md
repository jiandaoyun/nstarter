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

详细配置说明请参考 [配置文档](./docs/configuration.md)

```typescript
import { NsHttpClient, EClientAdapter } from 'nstarter-http-request';

const client = new NsHttpClient({
  adapter: EClientAdapter.axios,
  security: {
    enableDnsValidation: true,
    enableIpValidation: true,
    allowPrivateIp: false
  },
  logging: {
    enabled: true
  },
  request: {
    timeout: 30000,
    retries: 3
  }
});
```

## 详细文档

- [完整配置示例](./docs/configuration.md) - 所有配置选项的详细说明
- [安全配置](./docs/security.md) - SSRF 防护、SSL 验证、域名黑白名单等安全特性
- [日志配置](./docs/logging.md) - 日志记录、过滤、自定义日志器等
- [正向代理配置](./docs/proxy.md) - HTTP/HTTPS 正向代理和 no_proxy 配置
- [适配器切换](./docs/adapters.md) - Axios 和 Undici 适配器的选择与切换
- [W3C Trace Context 支持](./docs/trace-context.md) - 分布式链路追踪支持

