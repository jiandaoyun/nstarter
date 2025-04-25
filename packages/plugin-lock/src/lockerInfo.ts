/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import { getRedis } from './redis';

/**
 * 帮助类：处理锁和信号量的持有者信息
 */
export class LockerInfoHelper {
    readonly #resourceKey: string;
    readonly #lockerInfoKey: string;
    readonly #locker?: string;

    /**
     * 构造函数
     * @param resourceKey - 资源键名
     * @param locker - 持有者信息
     */
    constructor(resourceKey: string, locker?: string) {
        this.#resourceKey = resourceKey;
        this.#lockerInfoKey = `${resourceKey}:locker`;
        this.#locker = locker;
    }

    /**
     * 获取资源键名
     */
    public get resourceKey(): string {
        return this.#resourceKey;
    }

    /**
     * 获取持有者信息键名
     */
    public get lockerInfoKey(): string {
        return this.#lockerInfoKey;
    }

    /**
     * 获取持有者信息
     */
    public get locker(): string | undefined {
        return this.#locker;
    }

    /**
     * 设置持有者信息
     * @param value - 持有者信息值
     */
    public async setLockerInfo(value: string): Promise<void> {
        const provider = getRedis();
        // 24 小时过期
        const ttl = 24 * 60 * 60;
        await provider.client.set(this.#lockerInfoKey, value, 'EX', ttl);
    }

    /**
     * 获取持有者信息
     * @returns 持有者信息，如果不存在则返回null
     */
    public async getLockerInfo(): Promise<string | null> {
        const provider = getRedis();
        return provider.client.get(this.#lockerInfoKey);
    }

    /**
     * 删除持有者信息
     */
    public async deleteLockerInfo(): Promise<void> {
        const provider = getRedis();
        await provider.client.del(this.#lockerInfoKey);
    }
} 