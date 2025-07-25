# Changelog

## 0.1.0

- 基于 OpenTelemetry NodeSDK 提供 `TraceSDK` 用于观测组件管理
- 提供 `span` 装饰器封装，用于标记跟踪类方法执行
- 提供实验性 `NStarterInstrumentation` 对 nstarter 中的 service 方法实现自动跟踪观测

## 0.1.1
- 修复 `span` 创建后未设置上下文导致无法正确形成父子关系的问题

