/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import { test } from '@japa/runner';
import { randomUUID } from 'crypto';
import { LockerInfoHelper } from '../src';
import { getRedis } from '../src/redis';
import './types';

test.group('LockerInfoHelper', (group) => {
    const redis = getRedis().client;
    const resourceKey = `unit:${ randomUUID() }`;
    const lockerInfoKey = `${resourceKey}:locker`;

    group.each.setup(() => async () => {
        await redis.del(resourceKey);
        await redis.del(lockerInfoKey);
    });

    test('构造函数正确设置属性', async ({ assert }) => {
        const lockerId = 'test-user-123';
        const helper = new LockerInfoHelper(resourceKey, lockerId);

        assert.equal(helper.resourceKey, resourceKey);
        assert.equal(helper.lockerInfoKey, lockerInfoKey);
        assert.equal(helper.locker, lockerId);
    });

    test('设置和获取锁持有者信息', async ({ assert }) => {
        const lockerId = 'test-user-456';
        const helper = new LockerInfoHelper(resourceKey, lockerId);

        // 设置锁持有者信息
        await helper.setLockerInfo(lockerId);

        // 检查Redis中是否正确设置
        const storedValue = await redis.get(lockerInfoKey);
        assert.equal(storedValue, lockerId);

        // 通过helper获取锁持有者信息
        const retrievedValue = await helper.getLockerInfo();
        assert.equal(retrievedValue, lockerId);
    });

    test('删除锁持有者信息', async ({ assert }) => {
        const lockerId = 'test-user-789';
        const helper = new LockerInfoHelper(resourceKey, lockerId);

        // 设置锁持有者信息
        await helper.setLockerInfo(lockerId);
        assert.equal(await redis.exists(lockerInfoKey), 1);

        // 删除锁持有者信息
        await helper.deleteLockerInfo();
        assert.equal(await redis.exists(lockerInfoKey), 0);
    });

    test('TTL设置正确', async ({ assert }) => {
        const lockerId = 'test-user-000';
        const helper = new LockerInfoHelper(resourceKey, lockerId);

        // 设置锁持有者信息
        await helper.setLockerInfo(lockerId);

        // 验证TTL设置（24小时 = 86400秒）
        const ttl = await redis.ttl(lockerInfoKey);
        // ttl可能会有几秒钟的偏差，所以我们检查它是否在合理范围内
        assert.isTrue(ttl > 86000 && ttl <= 86400);
    });

    test('当未提供locker时行为正确', async ({ assert }) => {
        const helper = new LockerInfoHelper(resourceKey); // 没有提供locker

        assert.isUndefined(helper.locker);
        
        // 尝试设置某个值
        await helper.setLockerInfo('some-value');
        
        // 能够正常工作
        const value = await helper.getLockerInfo();
        assert.equal(value, 'some-value');
    });
}); 