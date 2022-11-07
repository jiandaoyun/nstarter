/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import { Mutex as DefaultMutex, RedlockMutex } from 'redis-semaphore';
import { getRedis } from './redis';
import { ILock, ILockOptions } from './types';

export class DistributedLock implements ILock {
    readonly #key;
    readonly #mutex;

    constructor(
        key: string,
        options?: ILockOptions
    ) {
        this.#key = key;
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
        return this.#mutex.acquire();
    }

    public async tryAcquire(): Promise<boolean> {
        return this.#mutex.tryAcquire();
    }

    public async release(): Promise<void> {
        return this.#mutex.release();
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
