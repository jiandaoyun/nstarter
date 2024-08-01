/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import { test } from '@japa/runner';
import { randomUUID } from 'crypto';
import { DistributedLock, ILockOptions } from '../src';
import { getRedis } from '../src/redis';
import './types';

test.group('DistributedLock', (group) => {
    const redis = getRedis().client;
    const key = `unit:${ randomUUID() }`;
    const o: ILockOptions = { acquireAttemptsLimit: 1 };
    const redisKey = `mutex:${ key }`;

    group.each.setup(() => async () => redis.del(redisKey));

    test('acquireAndRelease', async ({ assert }) => {
        const lock = new DistributedLock(key, o);
        await lock.acquire();
        assert.equal(await redis.exists(redisKey), 1);
        await lock.release();
        assert.equal(await redis.exists(redisKey), 0);
    });

    test('tryAcquireAndRelease', async ({ assert }) => {
        const lock = new DistributedLock(key, o);
        assert.isTrue(await lock.tryAcquire());
        assert.equal(await redis.exists(redisKey), 1);
        await lock.release();
        assert.equal(await redis.exists(redisKey), 0);
    });

    test('conflict', async ({ assert }) => {
        const lock1 = new DistributedLock(key, o);
        const lock2 = new DistributedLock(key, o);
        assert.isTrue(await lock1.tryAcquire());
        assert.isFalse(await lock2.tryAcquire());
    });

    test('timeout', async ({ assert }) => {
        const lock = new DistributedLock(key, { ...o, lockTimeout: 1000 });
        await lock.acquire();
        lock.stopRefresh();
        assert.equal(await redis.exists(redisKey), 1);
        await new Promise((resolve) => setTimeout(resolve, 1100));
        // assert.isFalse(lock.isAcquired);
        assert.equal(await redis.exists(redisKey), 0);
    });

    test('refresh', async ({ assert }) => {
        const lock = new DistributedLock(key, { ...o, lockTimeout: 1000 });
        await lock.acquire();
        assert.equal(await redis.exists(redisKey), 1);
        await new Promise((resolve) => setTimeout(resolve, 1100));
        assert.isTrue(lock.isAcquired);
        assert.equal(await redis.exists(redisKey), 1);
    });
});
