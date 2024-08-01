/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import { test } from '@japa/runner';
import { randomUUID } from 'crypto';
import { DistributedSemaphore, ILockOptions } from '../src';
import { getRedis } from '../src/redis';
import './types';

test.group('DistributedSemaphore', (group) => {
    const redis = getRedis().client;
    const key = `unit:${ randomUUID() }`;
    const o: ILockOptions = { acquireAttemptsLimit: 1 };

    group.each.setup(() => async () => redis.del(key));

    test('acquireAndRelease', async ({ assert }) => {
        const semaphore1 = new DistributedSemaphore(key, 2, o);
        const semaphore2 = new DistributedSemaphore(key, 2, o);
        const semaphore3 = new DistributedSemaphore(key, 2, o);
        await semaphore1.acquire();
        await semaphore2.acquire();
        await assert.rejects(async () => semaphore3.acquire());
        await semaphore2.release();
        await semaphore3.acquire();
    });
});
