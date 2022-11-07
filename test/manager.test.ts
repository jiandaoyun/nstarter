/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import { test } from '@japa/runner';
import { IKeyedResource, LockManager } from '../src';

test.group('LockManager', () => {
    class StubLock implements IKeyedResource {
        #isLocked = false;

        constructor(
            public key: string,
            public acquired: string[]
        ) {}

        public async acquire(): Promise<void> {
            this.acquired.push(this.key);
            this.#isLocked = true;
        }

        public async release(): Promise<void> {
            this.#isLocked = false;
        }

        public async tryAcquire(): Promise<boolean> {
            this.acquired.push(this.key);
            this.#isLocked = true;
            return this.#isLocked;
        }

        public isLocked(): boolean {
            return this.#isLocked;
        }
    }

    test('acquire', async ({ assert }) => {
        const acquired: string[] = [];
        const [lock1, lock2] = [new StubLock('1', acquired), new StubLock('2', acquired)];
        const lockManager = new LockManager([lock2, lock1]);
        await lockManager.acquire();
        assert.isTrue(lock1.isLocked());
        assert.isTrue(lock2.isLocked());
        assert.sameOrderedMembers(acquired, ['1', '2']);
    });

    test('tryAcquire', async ({ assert }) => {
        const acquired: string[] = [];
        const [lock1, lock2] = [new StubLock('1', acquired), new StubLock('2', acquired)];
        const lockManager = new LockManager([lock2, lock1]);
        assert.isTrue(await lockManager.tryAcquire());
        assert.isTrue(lock1.isLocked());
        assert.isTrue(lock2.isLocked());
        assert.sameOrderedMembers(acquired, ['1', '2']);
    });

    test('release', async ({ assert }) => {
        const acquired: string[] = [];
        const [lock1, lock2] = [new StubLock('1', acquired), new StubLock('2', acquired)];
        const lockManager = new LockManager([lock2, lock1]);
        await lockManager.acquire();
        assert.isTrue(lock1.isLocked());
        assert.isTrue(lock2.isLocked());
        await lockManager.release();
        assert.isFalse(lock1.isLocked());
        assert.isFalse(lock2.isLocked());
    });

    class RejectLock extends StubLock {
        public override async acquire(): Promise<void> {
            throw new Error();
        }

        public override async tryAcquire(): Promise<boolean> {
            return false;
        }
    }

    test('releaseIfAnyFailed', async ({ assert }) => {
        const acquired: string[] = [];
        const [lock1, lock2] = [new RejectLock('1', acquired), new StubLock('2', acquired)];
        const lockManager = new LockManager([lock2, lock1]);
        await assert.rejects(() => lockManager.acquire());
        assert.isFalse(lock1.isLocked());
        assert.isFalse(lock2.isLocked());
    });
});
