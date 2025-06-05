/**
 * Redis 连接配置接口
 * 支持单机、哨兵、集群（待验证）三种模式
 * 单机配置：
 *   redis：
 *     name: jdy
 *     password: r49Uah83d14dYfqZR3tSYCZ4
 *     db: 0
 *     host: redis.components.svc.cluster.local
 *     port: 6379
 * 哨兵配置
 *   redis：
 *     name: mymaster
 *     password: r49Uah83d14dYfqZR3tSYCZ4
 *     sentinelPassword: r49Uah83d14dYfqZR3tSYCZ4
 *     sentinels:
 *       - host: redis-session.components.svc.cluster.local
 *         port: 26379
 *     db: 0
 */
export interface IRedisConfig {
    readonly username?: string;         // Redis 用户名（ACL 认证）
    readonly password?: string;         // 主从节点访问密码
    readonly host?: string;             // 单机模式主机地址
    readonly port?: number;             // 单机模式端口（默认 6379）

    readonly name?: string;             // 哨兵模式主节点名称（如 "mymaster"）
    readonly sentinelPassword?: string; // 哨兵节点认证密码
    readonly sentinels?: {              // 哨兵节点列表
        readonly host: string,
        /**
         * @type integer
         * @minimum 1
         * @maximum 65535
         */
        readonly port: number
    }[];

    readonly db?: number;               // 数据库索引（0-15）
    readonly ssl?: boolean;             // 是否启用 SSL 加密
    readonly lazyConnect?: boolean;     // 是否延迟连接
    readonly isCluster?: boolean;       // 是否为集群模式
}

/**
 * rua脚本
 */
export interface ILuaScriptConfig {
    name: string;
    numberOfKeys: number;
    lua: string;
}
