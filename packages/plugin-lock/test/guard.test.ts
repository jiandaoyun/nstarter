/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import { test } from '@japa/runner';
import { IResource, LockGuard } from '../src';
import './types';

test.group('LockGuard', () => {
    class StubLock implements IResource {
        #isLocked = false;

        public async acquire(): Promise<void> {
            this.#isLocked = true;
        }

        public async release(): Promise<void> {
            this.#isLocked = false;
        }

        public async tryAcquire(): Promise<boolean> {
            this.#isLocked = true;
            return this.#isLocked;
        }

        public isLocked(): boolean {
            return this.#isLocked;
        }
    }

    test('lockAndRun', async ({ assert }) => {
        const lock = new StubLock();
        let hasRun = false;
        await LockGuard
            .withLock(lock)
            .run(async () => {
                assert.isTrue(lock.isLocked());
                hasRun = true;
            });
        assert.isFalse(lock.isLocked());
        assert.isTrue(hasRun);
    });

    test('throwAndUnlock', async ({ assert }) => {
        const lock = new StubLock();
        let hasRun = false;
        await assert.rejects(() => LockGuard
            .withLock(lock)
            .run(async () => {
                assert.isTrue(lock.isLocked());
                hasRun = true;
                throw new Error();
            }));
        assert.isFalse(lock.isLocked());
        assert.isTrue(hasRun);
    });

    class RejectLock extends StubLock {
        public override async acquire(): Promise<void> {
            throw new Error();
        }
    }

    test('rejectAndNotRun', async ({ assert }) => {
        const lock = new RejectLock();
        let hasRun = false;
        await assert.rejects(() => LockGuard
            .withLock(lock)
            .run(async () => {
                hasRun = true;
            }));
        assert.isFalse(lock.isLocked());
        assert.isFalse(hasRun);
    });
});
