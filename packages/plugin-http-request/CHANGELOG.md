# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-05

### Added

- 初始版本发布
- HTTP 客户端核心功能
  - 支持 Axios 和 Undici 两种适配器
  - 统一的请求/响应接口
  - 自动重试机制
  - 超时控制
  - 代理支持

- 安全防护功能
  - IP 地址验证（阻止私有 IP、回环地址、Link-Local 等）
  - DNS 解析验证和缓存
  - URL 黑白名单支持（通配符）
  - SSRF 防护
  - DNS 重绑定攻击防护

- 日志记录功能
  - 可插拔的日志适配器
  - 请求/响应详细日志
  - 业务场景标识
  - 可配置的日志级别和内容
  - 敏感信息脱敏

- 测试套件
  - 单元测试（IP 验证、URL 验证、配置管理等）
  - 集成测试（端到端、错误场景）
  - 性能测试（Axios vs Undici 对比）

- 文档
  - README 主文档
  - 使用示例文档
  - 迁移指南
  - API 文档

### Security

- 默认启用 DNS 和 IP 验证
- 默认阻止访问私有 IP 地址
- 防止 DNS 重绑定攻击
- 支持域名黑白名单

[0.1.0]: https://github.com/yourorg/http-client/releases/tag/v0.1.0

