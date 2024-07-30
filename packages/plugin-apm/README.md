# nstarter-apm

`nstarter-apm` 是为 nstarter 框架工程提供的 APM 业务跟踪插件，用于业务方法的执行跟踪与性能分析，基于 ElasticAPM 方案实现。

注意：
* `nstarter-apm` 提供的 APM 工具依赖装饰器环境，使用前需要确认已开启装饰器支持。

## 安装

使用 npm 进行安装。

```bash
npm install -S nstarter-apm
```

## 使用

### 初始化

在完成 apmAgent 客户端的实例配置以后，直接通过 `nstarter-apm` 提供的 `apmConnector.setApmAgent` 方法来动态注册客户端用于跟踪连接。

```typescript
import { apmConnector, apmAgent } from 'nstarter-apm';
const apm = apmAgent.start({
    serviceName: 'nstarter-apm',
    captureBody: 'all',
    captureHeaders: true,
    transactionSampleRate: 1,
    transactionMaxSpans: 100,
    active: true
});

apmConnector.setApmAgent(apm);
```

### 业务跟踪

对于业务中需要跟踪执行状态的业务事务 (Transaction)，可以使用 `@apmTransaction` 来进行标记，在执行过程会自动记录内部业务的开始与完成状态，而无需其他处理。

`nstarter-apm` 提供的跟踪装饰器支持四种类型的函数方法实现形式，分别是标准同步函数，promise 异步函数，async 函数，回调返回函数。

```typescript
import { apmTransaction } from 'nstarter-apm';

export class TransactionFunc {
    @apmTransaction()
    public normalFunc() {
        loop();
        return 'normal';
    }

    @apmTransaction('promiseTask', {
        labels: {
            message: 'trace message'
        }
    })
    public promiseFunc() {
        return new Promise((resolve) =>
            setTimeout(() => {
                resolve('promise')
            }, 100)
        );
    }

    @apmTransaction()
    public async asyncFunc() {
        await sleep(100);
        return 'async';
    }

    @apmTransaction()
    public callbackFunc(callback: Function) {
        setTimeout(() => callback(null, 'callback'), 100);
    }
}
```

对于业务事务内部的自定义分段 (Span)，同样可以采用与事务本身类似的方式，使用 `@apmSpan` 方法装饰器来标注需要被跟踪的业务方法。需要注意的是，按照 ElasticAPM 的跟踪规则，只有被包含在 APM 事务跟踪内部的分段，才会被实际记录。如果 span 跟踪未被包含在 transaction 内部，则不会对相关操作执行跟踪。

```typescript
import { apmSpan } from 'nstarter-apm';

export class SpanFunc {
    @apmSpan()
    public normalFunc() {
        loop();
        return 'normal';
    }
}
```

### 装饰器参数

`@apmTransaction` 与 `@apmSpan` 两个装饰器都支持通过参数进行额外的跟踪配置：

- `name` - 跟踪业务/分段操作对应的名称标记。可选，默认为 "类名" + "方法名" 组合的形式
- `options` - 其他 APM 跟踪配置参数，如类型，标签等，主要用于筛选器筛选。可选。
   
   ```typescript
   export interface ITransactionOptions {
       type?: string;
       labels?: {
           [key: string]: string | number | boolean | null | undefined
       };
   }

   export interface ISpanOptions {
       type?: string;
       subtype?: string;
       action?: string;
       labels?: {
           [key: string]: string | number | boolean | null | undefined
       };
   }
   ```
  
   - 'type' - 业务类型标记，任意字符串
   - 'subtype' - 子类型标记
   - 'action' - 行为分类标记
   - 'labels' - 额外标签信息

### 环境变量

nstarter-apm 使用标准 ElasticAPM node.js 客户端提供的环境变量进行配置注入管理，用于注入部分可配置参数。

具体可参考： https://www.elastic.co/guide/en/apm/agent/nodejs/current/configuration.html
