/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import { test } from '@japa/runner';
import { randomUUID } from 'crypto';
import type { ILockOptions} from '../src';
import { DistributedLock, LockerInfoHelper } from '../src';
import { getRedis } from '../src/redis';
import './types';

test.group('DistributedLock', (group) => {
    const redis = getRedis().client;
    const key = `unit:${ randomUUID() }`;
    const o: ILockOptions = { acquireAttemptsLimit: 1 };
    const redisKey = `mutex:${ key }`;
    const lockerInfoKey = `${ key }:locker`;

    group.each.setup(() => async () => {
        await redis.del(redisKey);
        await redis.del(lockerInfoKey);
    });

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

    test('lockerInfo - set and delete on acquire and release', async ({ assert }) => {
        const lockerId = 'test-user-123';
        const lock = new DistributedLock(key, { ...o, locker: lockerId });
        await lock.acquire();

        // 验证锁持有者信息已经设置
        const lockerInfo = await redis.get(lockerInfoKey);
        assert.equal(lockerInfo, lockerId);

        await lock.release();

        // 验证锁持有者信息已经删除
        assert.equal(await redis.exists(lockerInfoKey), 0);
    });

    test('lockerInfo - set and delete on tryAcquire and release', async ({ assert }) => {
        const lockerId = 'test-user-456';
        const lock = new DistributedLock(key, { ...o, locker: lockerId });

        const acquired = await lock.tryAcquire();
        assert.isTrue(acquired);

        // 验证锁持有者信息已经设置
        const lockerInfo = await redis.get(lockerInfoKey);
        assert.equal(lockerInfo, lockerId);

        await lock.release();

        // 验证锁持有者信息已经删除
        assert.equal(await redis.exists(lockerInfoKey), 0);
    });

    test('lockerInfo - conflict with locker info in error', async ({ assert }) => {
        const lockerId1 = 'test-user-789';
        const lockerId2 = 'test-user-987';

        const lock1 = new DistributedLock(key, { ...o, locker: lockerId1 });
        const lock2 = new DistributedLock(key, { ...o, locker: lockerId2 });

        await lock1.acquire();

        try {
            await lock2.acquire();
            assert.fail('应该抛出错误');
        } catch (error) {
            assert.include(error.message, `locker: ${ lockerId1 }`);
        }

        await lock1.release();
    });

    test('lockerInfo helper functionality', async ({ assert }) => {
        const lockerId = 'test-user-000';
        const helper = new LockerInfoHelper(key, lockerId);

        // 设置锁持有者信息
        await helper.setLockerInfo(lockerId);

        // 获取锁持有者信息
        const locker = await helper.getLockerInfo();
        assert.equal(locker, lockerId);

        // 删除锁持有者信息
        await helper.deleteLockerInfo();

        // 验证锁持有者信息已删除
        const deletedLocker = await helper.getLockerInfo();
        assert.isNull(deletedLocker);
    });
});
