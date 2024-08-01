import nconf, { IFormat } from 'nconf';
import _ from 'lodash';
import fs from 'fs';
import { EventEmitter } from 'events';
import { watch } from 'chokidar';

import { ConfigLoadEvents, IConfig, IConfigLoaderOptions } from './types';
import { Logger } from './logger';
import { configFormats } from './config_formats';


/**
 * 事件定义
 */
export declare interface ConfigLoader<T> {
    on: ((event: ConfigLoadEvents, listener: (...args: any[]) => void) => this);
}

/**
 * 配置装载器
 */
export class ConfigLoader<T extends IConfig> extends EventEmitter {
    private readonly _options: IConfigLoaderOptions;
    // 配置对象
    private readonly _conf: T;
    // 配置文件列表
    private _configFiles: string[] = [];

    // 已加载配置文件集合
    private _loadedConfFileSet: Set<string> = new Set();

    /**
     * @constructor
     */
    constructor(Config: Constructor<T>, options: IConfigLoaderOptions) {
        super();
        this._conf = new Config();
        this._options = _.defaults(options, {
            files: [],
            useEnv: false,
            useHotReload: false,
            useIncludes: false,
            extra: {}
        });
        const o = this._options;
        this._configFiles = _.uniq(o.files);
    }

    /**
     * 执行配置加载初始化
     */
    public initialize() {
        const o = this._options;
        nconf.use('memory');
        try {
            this.loadConfig();
        } catch (err) {
            this.emit(ConfigLoadEvents.init_failed, [err]);
            // 异常后中断加载过程
            return this;
        }
        // 检查并加载配置引用
        if (o.useIncludes) {
            this.loadIncludeFiles();
        }
        // 启用热加载
        if (o.useHotReload) {
            this.watchConfigChange();
        }
        return this;
    }

    /**
     * 加载配置内容
     */
    public loadConfig() {
        const o = this._options;
        nconf.reset();
        // 加载环境变量
        if (o.useEnv) {
            nconf.env();
        }
        // 加载配置文件
        _.forEach(this._configFiles, (configPath, idx) => {
            this._loadConfFile(configPath, `config_${ idx }`);
        });
        try {
            this._conf.fromJSON({
                ...this._options.extra,
                ...nconf.get()
            });
            Logger.horizontalRule();
        } catch (err) {
            // 配置阶段 logger 未完成初始化
            Logger.error('Invalid config file, please check.');
            Logger.error(err.message);
            throw err;
        }
    }

    /**
     * 加载配置文件引用包含配置
     */
    public loadIncludeFiles() {
        if (!_.isEmpty(this._conf.includes)) {
            Logger.log(`Include config files found, reloading.`);
            this._configFiles = _.union(_.uniq(this._conf.includes), this._configFiles);
            // 按照新的覆盖顺序重新加载
            try {
                this.loadConfig();
            } catch (err) {
                this.emit(ConfigLoadEvents.reload_failed, [err]);
            }
        }
    }

    /**
     * 监听配置文件变更
     */
    public watchConfigChange() {
        this._loadedConfFileSet.forEach((configPath) => {
            const watcher = watch(configPath);
            watcher.on('change', () => {
                Logger.log(`Config file changed: ${ configPath }`);
                try {
                    this.loadConfig();
                    // 成功加载后，触发加载完成事件
                    this.emit(ConfigLoadEvents.reload, [this.getConfig()]);
                } catch (err) {
                    this.emit(ConfigLoadEvents.reload_failed, [err]);
                }
            });
        });
    }

    /**
     * 获取配置内容
     */
    public getConfig(): T {
        return this._conf;
    }

    /**
     * 按指定格式加载配置文件
     * @param path - 配置文件路径
     * @param key - 配置文件标识
     * @param format - 配置解析方法
     * @returns - 是否已加载配置文件
     * @private
     */
    private _loadConfFileWithFormat(path: string, key: string, format: IFormat) {
        if (!fs.existsSync(path)) {
            return false;
        }
        Logger.log(`Loading config: "${ path }"`);
        nconf.file(key, {
            file: path,
            format
        });
        this._loadedConfFileSet.add(path);
        return true;
    }

    /**
     * 加载配置文件内容
     * @param path - 配置文件路径
     * @param key - 配置文件标识
     * @private
     */
    private _loadConfFile(path: string, key: string): void {
        const match = path.match(/\.(?<format>json|yml|yaml)$/i);
        let format: IFormat;
        if (match?.groups?.format) {
            // 已指定配置文件格式
            format = configFormats[match.groups.format];
            this._loadConfFileWithFormat(path, key, format);
        } else {
            // 尝试不同格式规则加载
            _.forEach(configFormats, (format, type) => {
                const file = `${ path }.${ type }`;
                const isLoaded = this._loadConfFileWithFormat(file, key, format);
                // 对于单一环境仅加载一种配置
                return !isLoaded;
            });
        }
    }
}

