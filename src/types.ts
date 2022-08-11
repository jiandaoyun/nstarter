/**
 * redis 连接配置
 */
export interface IRedisConfig {
    readonly name?: string;
    readonly password?: string;
    readonly host?: string;
    readonly port?: number;
    readonly sentinels?: {
        readonly host: string,

        /**
         * @type integer
         * @minimum 1
         * @maximum 65535
         */
        readonly port: number
    }[];
    readonly db?: number;
    readonly ssl?: boolean;
    readonly isCluster?: boolean;
}

/**
 * rua脚本
 */
export interface ILuaScriptConfig {
    name: string;
    numberOfKeys: number;
    lua: string;
}
