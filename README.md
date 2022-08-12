# nstarter-redis

nstarter-redis 用于对 nstarter 项目的 redis 数据库连接进行关联，包含连接操作的封装，维持策略，数据库连接的配置结构定义等内容。

## 安装

```
npm install -s nstarter-redis
```

除了按照包本身以外，正常使用 nstarter-redis 还需要安装必要的外部依赖组件：

* @types/ioredis
* ioredis
* nstarter-core

## 组件定义

在 nstarter 工程中，使用简单的组件封装定义，即可将数据库连接实例包装为全局公用的 nstarter 组件实例。

```typescript
import { BaseComponent, component } from 'nstarter-core';
import { config } from '../config';
import { LuaScripts } from '../lua';
import { RedisAdapter } from './lib/database/redis.adapter';
import { RedisConnector } from 'nstarter-redis';

@component()
export class RedisComponent extends BaseComponent {
    private readonly _redis: RedisConnector<RedisAdapter>;

    constructor() {
        super();
        this._redis = new RedisConnector(config.storage.redis, this._name);
        this._redis.on('ready', () => {
            this.setReady(true);
        });
        this._redis.loadLuaScripts(LuaScripts);
    }

    public isReady(): boolean {
        return this._redis.isReady();
    }

    public get redis() {
        return this._redis.getClient();
    }

    public async shutdown() {
        this._redis.disconnect();
    }
}
```

### 扩展redis方法


```typescript
/**
 * Copyright (c) 2015-2022, FineX, All Rights Reserved.
 * @author Zed
 * @date 2022/8/8
 */
import { IRedis } from 'nstarter-redis';

export interface RedisAdapter extends IRedis {
    /**
     * 查询成员组织架构缓存
     * @param {string} cacheKey - 缓存key
     * @param {number} timestamp - 时间戳
     * @param {string[]} args - 查询参数
     */
    queryMemberCache: (cacheKey: string, timestamp: number, ...args: string[]) => Promise<string>;
    /**
     * 增量缓存成员组织架构
     * @param {string} cacheKey - 缓存key
     * @param {number} timestamp - 时间戳
     * @param {string[]} args - 查询参数
     */
    storeMemberCache: (cacheKey: string, timestamp: number, ...args: string[]) => Promise<void>;
    del: (...keys: any[]) => Promise<number>;
    /**
     * 读写锁加锁
     * @param {string[]} lockArgs - 加锁 key
     * @param {Callback} callback - 回调函数
     * @example redis.readWriteLock(['aaa', 'X', 'bbb', 'IX', 'ccc', 'S', 'ddd', 'IS'], _.noop)
     */
    readWriteLock: (lockArgs: string[], callback: Callback) => void;
    /**
     * 读写锁解锁
     * @param {string[]} lockArgs - 解锁 key 列表
     * @param {Callback} callback - 回调函数
     * @example redis.readWriteUnlock(['aaa', ':X:1', 'bbb', ':IX:2', 'ccc', ':S:3', 'ddd', ':IS:4'], _.noop)
     */
    readWriteUnlock: (lockArgs: string[], callback: Callback) => void;

    /**
     * 并发限制器中并发执行个数加 1
     * @param key - 键
     * @param limit - 并发限制个数
     * @param identifier - UUID
     * @param lockTimeout - 锁超时时长
     * @param currentTimestamp - 当前时间戳
     */
    increaseConcurrencyCount: (
        key: string,
        limit: number,
        identifier: string,
        lockTimeout: number,
        currentTimestamp: number
    ) => Promise<string>;
    /**
     * 安排超过并发数的任务的下次重试时间（时间片方式）
     * @param maxTimeSliceKey - 排队的最大时间片的键
     * @param scheduleCountKey - 当前时间片上已安排的任务个数的键
     * @param nextTimeSlice - 下一个时间片的起始时间戳（单位：秒）
     * @param timeSliceDuration - 一个时间片的时长（单位：秒）
     * @param maxScheduleCount - 一个时间片上允许安排的最大任务个数
     */
    scheduleConcurrencyExceedJob: (
        maxTimeSliceKey: string,
        scheduleCountKey: string,
        nextTimeSlice: number,
        timeSliceDuration: number,
        maxScheduleCount: number
    ) => Promise<string[]>;
    /**
     * 可重入锁加锁
     * @param key
     * @param value
     * @param ttl
     */
    reentrantLock: (key: string, value: string, ttl: number) => Promise<string>;
    /**
     * 可重入锁解锁
     * @param key
     * @param value
     */
    unlockReentrantLock: (key: string, value: string) => Promise<string>;
}

```

### 配置结构

nstarter-redis 提供了以下的配置参数，可用于配置服务器连接方式，支持 Standalone, Sentinels, Cluster 三种不同的服务器拓扑架构。支持ssl，密码/无密码模式认证。

```yaml
redis:
  username: zed
  password: passw0rd
  host: localhost
  port: 6379
  sentinels:
  - host: server-1
    port: 6379
  - host: server-2
    port: 6379
  db: database
  ssl: true
  isCluster: false

```

