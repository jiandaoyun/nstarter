import querystring from 'querystring';
import { Logger } from 'nstarter-core';
import type { Connection, ConnectOptions } from 'mongoose';
import mongoose from 'mongoose';
import mongooseAsyncHooks from '@mongoosejs/async-hooks';
import type { IMongodbConfig, IMongodbQueryParams } from './types';
import { promisify } from 'util';
import { RECONNECT_DELAY } from './constants';

const _isObjectEmpty = (obj: {}) => !Object.keys(obj).length;

export let defaultConnection: Connection;

export class MongodbConnector {
    public readonly connection: Connection;
    private readonly _options: IMongodbConfig;
    private readonly _name: string = '';

    constructor(options: IMongodbConfig, name?: string) {
        this._options = options;
        if (name) {
            this._name = name;
        }
        this.connection = mongoose.createConnection();
        this.connection.plugin(mongooseAsyncHooks);
        // 关闭 mongoose 严格查询，保留 non-schema 过滤条件
        mongoose.set('strictQuery', false);
        // 关闭 mongoose upsert 的默认值逻辑（update、findOneAndUpdate）
        mongoose.set('setDefaultsOnInsert', false);
        // 关闭 mongoose 自动建表逻辑
        mongoose.set('autoCreate', false);
    }

    /**
     * 数据库连接入口方法
     */
    public connect() {
        return this._connectDatabase().then(() => {
            this.connection.on('disconnected', () => {
                Logger.error(`${ this._tag } mongodb server disconnected`);
            });
            this.connection.on('reconnected', () => {
                Logger.warn(`${ this._tag } mongodb server reconnected`);
            });
        });
    }

    /**
     * 建立数据库连接
     * @private
     */
    private async _connectDatabase(): Promise<void> {
        try {
            await this.connection.openUri(this.mongoUri, this.connectionConf);
        } catch (err) {
            Logger.error(`${ this._tag } mongodb connection failed, retrying...`, { error: err });
            await promisify(setTimeout)(RECONNECT_DELAY);
            await this._connectDatabase();
        }
    }

    private get mongoUri(): string {
        const { db, servers, replicaSet, srv } = this._options;
        let uri;
        // srv连接协议
        if (srv) {
            uri = `mongodb+srv://${ servers[0].host }/${ db }`;
        } else {
            const server = servers.map((server) =>
                `${ server.host }:${ server.port }`
            ).join(',');
            uri = `mongodb://${ server }/${ db }`;
        }
        // 扩展参数配置
        const queryParams: IMongodbQueryParams = {};
        if (replicaSet) {
            // 副本集
            queryParams.replicaSet = replicaSet;
        }
        if (!_isObjectEmpty(queryParams)) {
            uri += '?' + querystring.stringify(queryParams);
        }
        return uri;
    }

    /**
     * 获取数据库连接配置
     */
    private get connectionConf(): ConnectOptions {
        const { user, password, db, x509, timeoutMs, ssl, retryWrites, authSource, authMechanism } = this._options;
        const baseConf: ConnectOptions = {
            user,
            serverSelectionTimeoutMS: timeoutMs || 10000,
            socketTimeoutMS: 0,
            // @see https://github.com/mongodb/node-mongodb-native/blob/4.1/docs/CHANGES_4.0.0.md#connection-pool-options
            maxPoolSize: 10
        };
        /**
         * Azure cosmosDB必须开启ssl
         */
        if (ssl) {
            baseConf.ssl = true;
        }
        /**
         * Azure cosmosDB必须将retryWrites设置成false，否则insert操作将失败
         * @see https://github.com/microsoft/vscode-cosmosdb/issues/1343
         */
        if (retryWrites !== undefined) {
            baseConf.retryWrites = retryWrites;
        }
        if (x509 && !_isObjectEmpty(x509)) {
            // x509 认证方式
            return {
                ...baseConf,
                authMechanism: 'MONGODB-X509',
                authSource: '$external',
                ssl: true,
                tlsAllowInvalidCertificates: true,
                // 加载证书，如出现异常，直接中断退出
                tlsCAFile: x509.ca,
                tlsCertificateKeyFile: x509.key
            };
        } else {
            // 用户名密码认证
            return {
                ...baseConf,
                authMechanism,
                authSource: authSource ?? db,
                pass: password
            };
        }
    }

    private get _tag(): string {
        return `Mongodb${ this._name ? `:${ this._name }` : '' }`;
    }

    public isReady(): boolean {
        return this.connection.readyState === 1;
    }

    /**
     * 将当前实例设为默认实例 (不允许覆盖)
     */
    public setAsDefault(): boolean {
        if (defaultConnection) {
            return false;
        }
        defaultConnection = this.connection;
        return true;
    }
}
