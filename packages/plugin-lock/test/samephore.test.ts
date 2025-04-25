/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import { test } from '@japa/runner';
import { randomUUID } from 'crypto';
import { DistributedSemaphore, ILockOptions, LockerInfoHelper } from '../src';
import { getRedis } from '../src/redis';
import './types';

test.group('DistributedSemaphore', (group) => {
    const redis = getRedis().client;
    const key = `unit:${ randomUUID() }`;
    const o: ILockOptions = { acquireAttemptsLimit: 1 };
    const semaphoreInfoKey = `${key}:locker`;

    group.each.setup(() => async () => {
        await redis.del(key);
        await redis.del(semaphoreInfoKey);
    });

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
    
    test('lockerInfo - set and delete on acquire and release', async ({ assert }) => {
        const lockerId = 'test-user-123';
        const semaphore = new DistributedSemaphore(key, 2, { ...o, locker: lockerId });
        await semaphore.acquire();
        
        // 验证信号量持有者信息已经设置
        const lockerInfo = await redis.get(semaphoreInfoKey);
        assert.equal(lockerInfo, lockerId);
        
        await semaphore.release();
        
        // 验证信号量持有者信息已经删除
        assert.equal(await redis.exists(semaphoreInfoKey), 0);
    });

    test('lockerInfo - set and delete on tryAcquire and release', async ({ assert }) => {
        const lockerId = 'test-user-456';
        const semaphore = new DistributedSemaphore(key, 2, { ...o, locker: lockerId });
        
        const acquired = await semaphore.tryAcquire();
        assert.isTrue(acquired);
        
        // 验证信号量持有者信息已经设置
        const lockerInfo = await redis.get(semaphoreInfoKey);
        assert.equal(lockerInfo, lockerId);
        
        await semaphore.release();
        
        // 验证信号量持有者信息已经删除
        assert.equal(await redis.exists(semaphoreInfoKey), 0);
    });

    test('lockerInfo - error includes locker info', async ({ assert }) => {
        const lockerId1 = 'test-user-789';
        const lockerId2 = 'test-user-987';
        const lockerId3 = 'test-user-555';
        
        const semaphore1 = new DistributedSemaphore(key, 2, { ...o, locker: lockerId1 });
        const semaphore2 = new DistributedSemaphore(key, 2, { ...o, locker: lockerId2 });
        const semaphore3 = new DistributedSemaphore(key, 2, { ...o, locker: lockerId3 });
        
        await semaphore1.acquire();
        await semaphore2.acquire();
        
        try {
            await semaphore3.acquire();
            assert.fail('应该抛出错误');
        } catch (error) {
            // 错误消息中应该包含持有者信息（可能是多个持有者中的一个）
            const hasLockerInfo = error.message.includes(lockerId1) || error.message.includes(lockerId2);
            assert.isTrue(hasLockerInfo);
        }
        
        await semaphore1.release();
        await semaphore2.release();
    });
});
