# nstarter-config

nstarter 配置装载管理器


## 基本功能

* 支持从 json/yaml 加载配置文件生成配置对象
* 支持配置热更新
* 支持通过 includes 配置项引用注入配置文件

## 使用说明

```typescript
import { ConfigLoader, IConfig } from 'nstarter-config'

/**
 * 示例配置对象
 */
class DemoConfig implements IConfig {
    system: {
        locale: string,
        timezone: string
    };
    includes?: string[];

    public fromJSON(obj: any): void {
        Object.assign(this, obj);
    }
}

/**
 * 生成配置单例
 */
const config = new ConfigLoader<DemoConfig>(DemoConfig, {
    files: [
        './conf.d/config.override.yaml',
        './conf.d/config.base'
    ],
    useHotReload: true,
    useIncludes: true, 
    extra: {
        env: 'test'
    }
}).getConfig();
```

* 用法说明：
  - 首先声明用于构造配置单例的对象定义。
    > - 要求提供 `fromJSON` 方法，并建议方法执行过程中，有预校验入参，中断注入对象属性的逻辑。
    > - 推荐配合 `nstarter-entity` 使用
  - 配合 ConfigLoader 在提供合适配置参数后，初始化并装载配置对象。

* 参数说明：
  - `files` - 默认配置文件列表
  - `useHotReload` - 是否启用配置热加载，默认 `false`
  - `useIncludes` - 是否启用配置引用注入，默认 `false`
  - `extra` - 额外静态配置项
