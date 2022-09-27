import { EventEmitter } from 'events';
import IORedis from 'ioredis';
import { ILuaScriptConfig, IRedisConfig } from './types';

/**
 * redis实例代理
 */
export interface IRedis extends IORedis.Redis {

    duplicate: () => IRedis;

}

/**
 * redis 连接实现
 */
export class RedisConnector<T extends IRedis> extends EventEmitter {
    private readonly _client: T;
    private readonly _options: IORedis.RedisOptions;
    private readonly _name: string = '';
    private readonly _isCluster: boolean | undefined;

    constructor(options: IRedisConfig, name?: string) {
        super();
        this._isCluster = options.isCluster;
        this._options = {
            ...options
        };
        if (name) {
            this._name = name;
        }
        const o = {
            retryStrategy: () => 1000,
            enableReadyCheck: true,
            ...this._options
        };
        // 避免配置 minimize 清洗行为依赖
        if (!o.sentinels || o.sentinels.length === 0) {
            o.sentinels = undefined;
        }
        // 开启ssl
        if (options.ssl) {
            o.tls = {};
        }
        // 集群模式
        if (this._isCluster) {
            this._client = new IORedis.Cluster([{
                host: options.host,
                port: options.port
            }], {
                slotsRefreshTimeout: 3000,
                redisOptions: o
            }) as any as T;
            this._client.on('node error', (err) => {
                this.emit('error', `${ this._tag } cluster connection error`, err);
            });
        } else {
            this._client = new IORedis(o) as any as T;
        }
        this._client.on('error', (err) => {
            this.emit('error', `${ this._tag } connection error`, err);
        });
    }

    /**
     * 监听error事件
     */
    public onError(listener: (errMsg: string, err: any) => void) {
        this.on('error', listener);
    }

    /**
     * 监听ready事件
     */
    public onReady(listener: () => void) {
        this._client.on('ready', listener);
    }

    /**
     * 是否连接成功
     */
    public isReady(): boolean {
        return this._client.status === 'ready';
    }

    /**
     * redis实例
     */
    public getClient() {
        return this._client;
    }

    /**
     * 断开连接
     */
    public disconnect() {
        this._client.disconnect();
    }

    /**
     * 装载lua脚本
     */
    public loadLuaScripts(configs: ILuaScriptConfig[]) {
        for (const luaConfig of configs) {
            const { name, numberOfKeys, lua } = luaConfig;
            this._client.defineCommand(name, { numberOfKeys, lua });
        }
    }

    private get _tag(): string {
        return `Redis${ this._name ? `:${ this._name }` : '' }`;
    }
}
