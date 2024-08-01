/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import { RedlockSemaphore, Semaphore as DefaultSemaphore } from 'redis-semaphore';
import { getRedis } from './redis';
import { ISemaphoreOptions } from './types';

export class DistributedSemaphore {
    readonly #key;
    readonly #semaphore;

    constructor(
        key: string,
        limit: number,
        options?: ISemaphoreOptions
    ) {
        this.#key = key;
        const provider = getRedis();
        if (provider.isCluster) {
            const cluster = provider.client.nodes('master');
            this.#semaphore = new RedlockSemaphore(cluster, key, limit, options);
        } else {
            this.#semaphore = new DefaultSemaphore(provider.client, key, limit, options);
        }
    }

    public async acquire(): Promise<void> {
        return this.#semaphore.acquire();
    }

    public async tryAcquire(): Promise<boolean> {
        return this.#semaphore.tryAcquire();
    }

    public async release(): Promise<void> {
        return this.#semaphore.release();
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
