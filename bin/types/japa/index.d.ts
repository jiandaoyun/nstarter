/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import '@japa/assert';
import '@japa/runner';
import Redis from 'ioredis';

declare module '@japa/runner' {
    interface TestContext {
        isCI: boolean;
        redis?: Redis;
    }
}
