/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import { Mutex as DefaultMutex, RedlockMutex } from 'redis-semaphore';
import { getRedis } from './redis';
import type { ILock, ILockOptions } from './types';
import { LockerInfoHelper } from './lockerInfo';

export class DistributedLock implements ILock {
    readonly #key;
    readonly #mutex;
    readonly #lockerHelper: LockerInfoHelper;

    constructor(
        key: string,
        options?: ILockOptions,
    ) {
        this.#key = key;
        this.#lockerHelper = new LockerInfoHelper(key, options?.locker);
        const provider = getRedis();
        if (provider.isCluster) {
            // use red-lock implementation for cluster.
            const cluster = provider.client.nodes('master');
            this.#mutex = new RedlockMutex(cluster, key, options);
        } else {
            this.#mutex = new DefaultMutex(provider.client, key, options);
        }
    }

    public async acquire(): Promise<void> {
        try {
            await this.#mutex.acquire();
            if (this.#lockerHelper.locker) {
                await this.#lockerHelper.setLockerInfo(this.#lockerHelper.locker);
            }
        } catch (err: any) {
            const locker = await this.#lockerHelper.getLockerInfo();
            throw new Error(`${ err.message } (locker: ${ locker || 'unknow' })`);
        }
    }

    public async tryAcquire(): Promise<boolean> {
        const acquired = await this.#mutex.tryAcquire();
        if (acquired && this.#lockerHelper.locker) {
            await this.#lockerHelper.setLockerInfo(this.#lockerHelper.locker);
        }
        return acquired;
    }

    public async release(): Promise<void> {
        await this.#mutex.release();
        await this.#lockerHelper.deleteLockerInfo();
    }

    public get key(): string {
        return this.#key;
    }

    public get identifier(): string {
        return this.#mutex.identifier;
    }

    public get isAcquired(): boolean {
        return this.#mutex.isAcquired;
    }

    public stopRefresh(): void {
        this.#mutex.stopRefresh();
    }
}
