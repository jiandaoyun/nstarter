/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import { RedlockSemaphore, Semaphore as DefaultSemaphore } from 'redis-semaphore';
import { getRedis } from './redis';
import type { ISemaphoreOptions } from './types';
import { LockerInfoHelper } from './lockerInfo';
import { getNsError } from './error';

export class DistributedSemaphore {
    readonly #key;
    readonly #semaphore;
    readonly #lockerHelper: LockerInfoHelper;

    constructor(
        key: string,
        limit: number,
        options?: ISemaphoreOptions,
    ) {
        this.#key = key;
        this.#lockerHelper = new LockerInfoHelper(key, options?.locker);
        const provider = getRedis();
        if (provider.isCluster) {
            const cluster = provider.client.nodes('master');
            this.#semaphore = new RedlockSemaphore(cluster, key, limit, options);
        } else {
            this.#semaphore = new DefaultSemaphore(provider.client, key, limit, options);
        }
    }

    public async acquire(): Promise<void> {
        try {
            await this.#semaphore.acquire();
            if (this.#lockerHelper.locker) {
                await this.#lockerHelper.setLockerInfo(this.#lockerHelper.locker);
            }
        } catch (err: any) {
            const locker = await this.#lockerHelper.getLockerInfo();
            throw getNsError(err, { locker });
        }
    }

    public async tryAcquire(): Promise<boolean> {
        const acquired = await this.#semaphore.tryAcquire();
        if (acquired && this.#lockerHelper.locker) {
            await this.#lockerHelper.setLockerInfo(this.#lockerHelper.locker);
        }
        return acquired;
    }

    public async release(): Promise<void> {
        await this.#semaphore.release();
        await this.#lockerHelper.deleteLockerInfo();
    }

    public get key(): string {
        return this.#key;
    }

    public get identifier(): string {
        return this.#semaphore.identifier;
    }

    public get isAcquired(): boolean {
        return this.#semaphore.isAcquired;
    }

    public stopRefresh(): void {
        this.#semaphore.stopRefresh();
    }
}
