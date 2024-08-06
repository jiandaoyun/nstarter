/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import { Cluster, default as Standalone } from 'ioredis';

type RedisInstance = Standalone | Cluster;
type RedisProvider = {
    client: Standalone;
    isCluster: false;
} | {
    client: Cluster;
    isCluster: true;
};

let provider: RedisProvider;

function isCluster(redis: RedisInstance): redis is Cluster {
    const cluster = redis as Cluster;
    return cluster.isCluster || cluster.nodes !== undefined;
}

export function setRedis(redis: RedisInstance): void {
    if (isCluster(redis)) {
        provider = {
            client: redis,
            isCluster: true,
        };
    } else {
        provider = {
            client: redis,
            isCluster: false,
        };
    }
}

export function getRedis(): RedisProvider {
    if (provider) {
        return provider;
    } else {
        throw new Error('"client" must be instance of ioredis client or cluster');
    }
}
