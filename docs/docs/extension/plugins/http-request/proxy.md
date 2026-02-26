---
title: "正向代理配置"
sidebar_position: 5
---

# 正向代理配置

## 基础使用

```typescript
const client = new NsHttpClient()
  .withForwardProxy({
    enabled: true,
    http_proxy: 'http://proxy.example.com:8080',
    https_proxy: 'https://proxy.example.com:8443',
    no_proxy: [          // 不使用代理的域名（支持传统模式）
      'localhost',       // 精确匹配
      '127.0.0.1',       // 精确匹配
      '.internal.com',   // 后缀匹配（匹配所有子域名）
      '.local',          // 后缀匹配
      '192.168.'         // 前缀匹配（IP地址）
    ]
  });
```

## no_proxy 支持的模式

- `example.com` - 精确匹配该域名
- `.example.com` - 后缀匹配，匹配所有以 `.example.com` 结尾的域名（包括子域名）
- `192.168.` - 前缀匹配，主要用于 IP 地址范围匹配

## HTTP 代理配置（不同于正向代理）

```typescript
const client = new NsHttpClient({
  request: {
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
