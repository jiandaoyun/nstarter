# nstarter-redis

nstarter-redis 用于对 nstarter 项目的 redis 数据库连接进行关联，包含连接操作的封装，维持策略，数据库连接的配置结构定义等内容。

## 安装

```
npm install -s nstarter-redis
```

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
        this._redis = new RedisConnector(config.storage.redis);
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
  lazyConnect: false
  isCluster: false

```

