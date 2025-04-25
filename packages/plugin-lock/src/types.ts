/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import type { LockOptions } from 'redis-semaphore';

export interface IResource {
    acquire: () => Promise<void>;

    tryAcquire: () => Promise<boolean>;

    release: () => Promise<void>;
}

export interface IKeyedResource extends IResource {
    key: string;
}

export interface ILock extends IKeyedResource {
    stopRefresh: () => void;

    identifier: string;
    isAcquired: boolean;
}

export interface ILockOptions extends LockOptions {
    /**
     * 记录持有锁者的信息
     */
    locker?: string;
}

export interface ISemaphore extends IKeyedResource {
    stopRefresh: () => void;

    identifier: string;
    isAcquired: boolean;
}

export interface ISemaphoreOptions extends LockOptions {
    /**
     * 记录持有信号量者的信息
     */
    locker?: string;
}
