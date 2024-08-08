/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import type { IResource } from './types';

/**
 * lock guard.
 * @desc The class LockGuard is a lock wrapper that provides a convenient RAII-style mechanism for owning a lock for
 *       the duration of a scoped block. It attempts to take ownership of the lock it is given. When control leaves
 *       the scope in which the LockGuard::run was run, the lock is released either the function return or throw.
 *       Inspired by std::lock_guard of C++.
 * @example LockGuard
 *              .withLock(...)
 *              .run(async () => {...});
 */
export class LockGuard {
    readonly #resource: IResource;

    /**
     * constructor
     * @param resource - resource.
     * @private
     */
    private constructor(resource: IResource) {
        this.#resource = resource;
    }

    /**
     * factory.
     * @param resource - resource.
     */
    public static withLock(resource: IResource): LockGuard {
        return new LockGuard(resource);
    }

    /**
     * run within the lock context.
     * @param runAfterLockAcquired - callback after lock acquired.
     */
    public async run<T>(
        runAfterLockAcquired: () => Promise<T>
    ): Promise<T> {
        await this.#resource.acquire();
        try {
            return (await runAfterLockAcquired());
        } finally {
            await this.#resource.release();
        }
    }
}
