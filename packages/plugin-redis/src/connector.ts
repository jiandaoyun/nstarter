import { EventEmitter } from 'events';
import { Cluster, Redis, RedisOptions } from 'ioredis';
import { ILuaScriptConfig, IRedisConfig } from './types';

/**
 * redis实例代理
 */
export interface IRedis extends Redis {
    duplicate: () => IRedis;
}

export declare interface RedisConnector {
    on: // 连接建立
        ((event: 'ready', listener: () => void) => this) &
        // 连接出现异常错误
        ((event: 'error', listener: (err: Error) => void) => this);
}

/**
 * redis 连接实现
 */
export class RedisConnector extends EventEmitter {
    private readonly _client: Redis | Cluster;
    private readonly _isCluster: boolean | undefined;

    constructor(config: IRedisConfig) {
        super();
        this._isCluster = config.isCluster;
        const options: RedisOptions = {
            username: config.username,
            password: config.password,
            host: config.host,
            port: config.port,
            db: config.db,
            tls: config.ssl ? {} : undefined,
            lazyConnect: config.lazyConnect,
            sentinels: config.sentinels?.length === 0 ?
                undefined : config.sentinels,
            retryStrategy: () => 1000,
            enableReadyCheck: true,
        };
        if (this._isCluster) {
            // 集群模式
            this._client = new Cluster([{
                host: config.host,
                port: config.port
            }], {
                slotsRefreshTimeout: 3000,
                redisOptions: options
            });
            this._client.on('node error', (err) => {
                this.emit('error', err);
            });
        } else {
            // 单节点 | sentinel 模式
            this._client = new Redis(options);
            this._client.on('error', (err) => {
                this.emit('error', err);
            });
        }
        //
        this._client.on('ready', () => {
            this.emit('ready');
        });
    }

    /**
     * 是否连接成功
     */
    public isReady(): boolean {
        return this._client.status === 'ready';
    }

    /**
     * 获取 redis 实例
     */
    public getClient<T extends IRedis>(): T {
        // 兼容类型扩展，允许通过外部类型定义注册 lua 方法类型
        return this._client as any as T;
    }

    /**
     * 建立 redis 连接 (lazyConnect 模式下使用)
     */
    public async connect() {
        await this._client.connect();
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
}
