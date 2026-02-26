---
title: "适配器切换"
sidebar_position: 6
---

# 适配器切换

## 支持的适配器

本库支持多种 HTTP 客户端适配器，你可以根据场景选择最适合的：

- **Axios** - 适合通用场景，功能丰富，生态完善
- **Undici** - Node.js 原生高性能 HTTP 客户端，适合高并发场景

## 切换适配器

```typescript
import { EClientAdapter } from 'nstarter-http-request';

// 使用 Axios 适配器（适合通用场景）
const axiosClient = new NsHttpClient().withAdapter(EClientAdapter.axios);

// 使用 Undici 适配器（高性能，Node.js 原生）
const undiciClient = new NsHttpClient().withAdapter(EClientAdapter.undici);
```

## 在初始化时指定适配器

```typescript
import { NsHttpClient, EClientAdapter } from 'nstarter-http-request';

// 创建客户端实例时指定适配器
const client = new NsHttpClient({
  adapter: EClientAdapter.axios,
  security: {
    enableDnsValidation: false,
    enableIpValidation: false,
    allowPrivateIp: false
  }
});
```

## 适配器选择建议

### 使用 Axios 的场景

- 需要丰富的配置选项
- 需要拦截器功能
- 需要广泛的浏览器兼容性（通过 polyfill）
- 团队熟悉 Axios API

### 使用 Undici 的场景

- 需要极致性能
- 高并发场景
- 纯 Node.js 环境
- 希望减少依赖体积
