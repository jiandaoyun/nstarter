---
title: "运行环境"
weight: 103
---

## 运行环境

为了统一描述并跟踪不同的运行环境，框架提供了统一的运行环境 `RunEnv` 枚举定义。

```typescript
import {
    RunEnv
} from 'nstarter-core';
```

目前 `RunEnv` 提供了三种描述 `dev`, `test`, `production`，分别对应开发环境，测试环境，以及线上生产环境。
