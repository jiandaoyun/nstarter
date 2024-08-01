/**
 * 配置加载时间
 */
export enum ConfigLoadEvents {
    reload = 'reload',
    init_failed = 'init_failed',
    reload_failed = 'reload_failed'
}

export interface IConfig {
    /**
     * 引用包含文件定义
     */
    includes?: string[];

    /**
     * JSON 解析方法
     * @param obj
     */
    fromJSON: (obj: {}) => void;
}

/**
 *
 */
export interface IConfigLoaderOptions {
    // 配置文件列表
    files: string[];

    // 是否加载环境变量
    useEnv?: boolean;
    // 是否支持热更新
    useHotReload?: boolean;
    // 是否支持配置引用
    useIncludes?: boolean;

    // 扩展配置属性 (静态)
    extra?: {};
}
