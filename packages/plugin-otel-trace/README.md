# nstarter-otel-trace

`nstarter-otel-trace` 提供了 `nstarter` 开发框架下的面向开放式 `OpenTelemetry` 观测协议的链路跟踪工具。实现了 OTel 标准下「链路」/「指标」/「日志」中的「链路」观测能力，用于对业务服务进行性能观测分析。


## 安装

> `nstarter-otel-trace` 需要配合 `nstarter-core` 版本 >= 1.2.3 使用

```bash
npm install -S nstarter-otel-trace
```

在使用过程中需要注意，`nstarter-otel-trace` 包仅默认安装为实现其基本功能的基础依赖，对于在不同项目中需要使用的 exporter, instrumentation 等外部组件，需要自行跟据实际需求选择安装使用。

Node.js 开发中常用的 open-telemetry 组件还包括：

- `@opentelemetry/auto-instrumentations-node`
- `@opentelemetry/exporter-trace-otlp-http`
- `@opentelemetry/exporter-trace-otlp-proto`


## 使用

> ℹ️ OpenTelemetry 上游项目目前仍在快速迭代完善中，中长期的使用方式不排除会有变化。


### 启用跟踪

`nstarter-otel-trace` 对 OpenTelemetry NodeSDK 进行了简单包装，作为 `TraceSDK` 用来管理链路观测工具的使用生命周期。跟踪的基本启动过程如下：

```typescript
import { TraceSDK } from 'nstarter-otel-trace';

// 跟踪配置
const trace = new TraceSDK({
    traceExporter: {},
    instrumentations: [],
});

// 启动跟踪观测
trace.start();

// 优雅关闭
process.on("SIGTERM", () => {
    sdk.shutdown()
        .then(
            () => { console.log("SDK shut down successfully"); },
            (err) => { console.log("Error shutting down SDK", err); }
        )
        .finally(() => process.exit(0));
});
```

下面给再出一个更符合实际场景应用的配置示例，通过 http 形式 otlp 协议将跟踪记录推送给中心化采集端，并自动注如常见 Node.js 工具框架的采集跟踪逻辑，同时指定了对 request id 的跟踪记录。 

```typescript
import { TraceSDK, NStarterInstrumentation } from 'nstarter-otel-trace';

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { ExpressLayerType } from '@opentelemetry/instrumentation-express';
import { Resource } from '@opentelemetry/resources';
import {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

import { ContextProvider } from 'nstarter-core';

export const trace = new TraceSDK({
    traceExporter: new OTLPTraceExporter({
        url: 'http://localhost:5080/api/default/v1/traces',
        headers: {
            'Authorization': 'Basic <AUTH_TOKEN>'
        },
    }),
    instrumentations: [
        getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-express': {
                ignoreLayers: [],
                ignoreLayersType: [ ExpressLayerType.MIDDLEWARE ],
                requestHook: (span, info) => {
                    const context = ContextProvider.getContext();
                    if (context) {
                        span.setAttribute('request_id', context.traceId);
                    }
                }
            }
        }),
        new NStarterInstrumentation({})
    ],
    resource: new Resource({
        [ATTR_SERVICE_NAME]: 'ns-app',
        [ATTR_SERVICE_VERSION]: '1.0',
    }),
    resourceDetectors: [],
    sampler: new TraceIdRatioBasedSampler(0.1),
});
```

详细使用说明，可以参考 OpenTelemetry 官方文档。

> https://opentelemetry.io/docs/languages/js/getting-started/nodejs/#setup


### 手动跟踪

对于基础的类方法执行跟踪，通过提供的 `span` 装饰器完成对函数方法的执行跟踪。示例：

```typescript
import { span } from 'nstarter-otel-trace';

class ExampleService {
    @span('<traceName>')    // 跨度跟踪名称标记 (可选)
    public async doSomeThing() {
        // doing
    }
}
```

> ℹ️ 受限于 Typescript 装饰器的使用限制，目前仅限于对类方法使用装饰器跟踪。
> 其他场景下，需要依赖 OpenTelemetry 中的原生跟踪方法。
> https://opentelemetry.io/docs/languages/js/instrumentation/#create-spans


### 自动注册可观测仪表 (Instrumentation)

`nstarter-otel-trace` 中提供了对 `nstarter` 框架的的观测跟踪能力。通过配合在 OpenTelemetry 中配合使用 `NStarterInstrumentation`，可以实现对所有 service 方法的全自动跟踪，从而避免手动侵入业务层实现标记跟踪 span。

> ℹ️ `NStarterInstrumentation` 目前为实验性功能，其实现依赖了原型链对象属性注入的特性，可能会与其他依赖注入实现的包装工具存在行为冲突。

使用方法示例:

```typescript
import { TraceSDK, NStarterInstrumentation } from 'nstarter-otel-trace';

export const trace = new TraceSDK({
    instrumentations: [
        new NStarterInstrumentation({
            traceCallback: true     // 是否跟踪 callback 回调方法，默认为 false，不跟踪
        })
    ]
    // 其他配置
});

trace.start();
```

## 其他注意事项

* 全链路跟踪会对业务逻辑的执行带来可感知的性能影响，且容易产生比较可观的跟踪观测数据，一般建议在生产环境选择合适的采样跟踪策略。
