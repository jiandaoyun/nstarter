/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import type { IKeyedResource, IResource } from './types';

export class LockManager implements IResource {
    readonly #resources: IKeyedResource[];
    readonly #acquired = new Set();

    constructor(resources: IKeyedResource[]) {
        // order by key to avoid deadlock.
        this.#resources = resources.sort((a, b) => a.key.localeCompare(b.key));
    }

    protected async releaseAcquired(
        acquired: IKeyedResource[]
    ): Promise<void> {
        // release in reverse order.
        for (let i = acquired.length - 1; i >= 0; i--) {
            const resource = acquired[i];
            await resource.release();
            this.#acquired.delete(resource.key);
        }
    }

    protected async acquireInOrder(
        resources: IKeyedResource[],
        acquired: IKeyedResource[]
    ): Promise<void> {
        for (const resource of resources) {
            await resource.acquire();
            acquired.push(resource);
            this.#acquired.add(resource.key);
        }
    }

    public async tryAcquire(): Promise<boolean> {
        const acquired: IKeyedResource[] = [];
        try {
            await this.acquireInOrder(this.#resources, acquired);
            return true;
        } catch (e) {
            await this.releaseAcquired(acquired);
            return false;
        }
    }

    public async acquire(): Promise<void> {
        const acquired: IKeyedResource[] = [];
        try {
            await this.acquireInOrder(this.#resources, acquired);
        } catch (e) {
            await this.releaseAcquired(acquired);
            throw e;
        }
    }

    public async release(): Promise<void> {
        await this.releaseAcquired(this.#resources.filter(resource => this.#acquired.has(resource.key)));
    }
}
