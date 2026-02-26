---
title: "安全配置"
sidebar_position: 3
---

# 安全配置详解

## SSL 证书验证

```typescript
const client = new NsHttpClient({
  security: {
    rejectUnauthorized: true  // 生产环境必须为 true，开发环境可设为 false
  }
});
```

## SSRF 防护

默认情况下 DNS 验证与 IP 验证为**关闭**（`enableDnsValidation`、`enableIpValidation` 默认为 `false`）。如需 SSRF 防护，请显式开启：

```typescript
const client = new NsHttpClient({
  security: {
    enableDnsValidation: true,     // 启用 DNS 解析验证（默认关闭）
    enableIpValidation: true,      // 启用 IP 地址验证（默认关闭）
    allowPrivateIp: false,         // 禁止访问内网 IP（10.x.x.x, 192.168.x.x, 127.x.x.x 等）
    whitelist: [                   // 白名单（支持以下模式）
      'api.example.com',           // 1. 精确匹配
      '*.safe.com',                // 2. 通配符匹配（只匹配一级子域名）
      'trusted.com', '*.trusted.com' // 3. 组合使用：匹配根域名和一级子域名
    ],
    blacklist: ['malicious.com', '*.malicious.com'] // 黑名单：根域名 + 一级子域名
  }
});
```

## 支持的域名模式

| 模式 | 匹配规则 | 示例 |
|------|---------|------|
| `example.com` | 精确匹配 | ✅ `example.com`<br>❌ `api.example.com` |
| `*.example.com` | 通配符匹配<br>只匹配一级子域名（不含根域名） | ❌ `example.com`<br>✅ `api.example.com`<br>✅ `www.example.com`<br>❌ `v2.api.example.com`（多级不匹配） |
| 组合使用<br>`['example.com', '*.example.com']` | 精确匹配 + 通配符匹配<br>匹配根域名和一级子域名 | ✅ `example.com`<br>✅ `api.example.com`<br>✅ `www.example.com`<br>❌ `v2.api.example.com`（多级不匹配） |

## DNS 缓存机制

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
