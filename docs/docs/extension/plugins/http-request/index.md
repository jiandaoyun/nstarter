---
title: "nstarter-http-request"
sidebar_position: 1
---

# nstarter-http-request

`nstarter-http-request` 是 HTTP 请求客户端插件，提供 SSRF 防护、日志记录、正向代理等安全与可观测能力。支持 Axios 与 Undici
两种适配器，可按场景切换。

## 安装

```bash
npm install -S nstarter-http-request
```

使用 Axios 适配器时需安装 `axios`；使用 Undici 适配器时需安装 `undici`（Node 18+ 内置，可选安装）。

## 基本使用

```typescript
import {
    NsHttpClient,
    EClientAdapter
} from 'nstarter-http-request';

const client = new NsHttpClient({
    adapter: EClientAdapter.axios,
    security: {
        enableDnsValidation: false,  // 默认关闭，设为 true 可启用 SSRF 防护中的 DNS 验证
        enableIpValidation: false,   // 默认关闭，设为 true 可启用 IP 验证
        allowPrivateIp: false
    }
});

const response = await client.get('https://api.example.com/users');
const user = await client.post('https://api.example.com/users', { name: 'John', email: 'john@example.com' });
```

## 文档导航

- [完整配置示例](./configuration.md) - 所有配置选项与默认值
- [安全配置](./security.md) - SSRF 防护、SSL、域名黑白名单、DNS 缓存
- [日志配置](./logging.md) - 日志记录与过滤
- [正向代理配置](./proxy.md) - HTTP/HTTPS 正向代理与 no_proxy
- [适配器切换](./adapters.md) - Axios 与 Undici 选择
- [W3C Trace Context](./trace-context.md) - 分布式链路追踪
