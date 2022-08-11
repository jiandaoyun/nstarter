import IORedis, { Redis } from 'ioredis';
import _ from 'lodash';
import { Logger } from 'nstarter-core';
import { ILuaScriptConfig, IRedisConfig } from './types';

/**
 * redis 连接实现
 */
export class RedisConnector<T extends Redis> {
    private readonly _client: T;
    private readonly _options: IORedis.RedisOptions;
    private readonly _name: string = '';
    private readonly _isCluster: boolean | undefined;

    constructor(options: IRedisConfig, name?: string) {
        this._isCluster = options.isCluster;
        this._options = {
            ...options
        };
        if (name) {
            this._name = name;
        }
        const o = _.defaults({
            retryStrategy: () => 1000,
            enableReadyCheck: true
        }, this._options);
        // 避免配置 minimize 清洗行为依赖
        if (_.isEmpty(o.sentinels)) {
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
                Logger.error(`${ this._tag } connection error`, { err });
            });
        } else {
            this._client = new IORedis(o) as any as T;
        }
        this._client.on('error', (err) => {
            Logger.error(`${ this._tag } connection error`, { err });
        });
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
     * once监听
     */
    public once(event: string, listener: () => void) {
        this._client.once(event, listener);
    }

    /**
     * on监听
     */
    public on(event: string, listener: () => void) {
        this._client.on(event, listener);
    }

    /**
     * 装载lua脚本
     */
    public loadLuaScripts(configs: ILuaScriptConfig[]) {
        _.forEach(configs, (luaConfig) => {
            const { name, numberOfKeys, lua } = luaConfig;
            this._client.defineCommand(name, { numberOfKeys, lua });
        });
    }

    private get _tag(): string {
        return `Redis${ this._name ? `:${ this._name }` : '' }`;
    }
}
