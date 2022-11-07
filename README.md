## 概述

nstarter-lock 包装了基于 Redis 的分布式锁的一些常用实现, 包括:

* 分布式锁 DistributedLock
* 分布式信号量 DistributedSemaphore
* 资源保护 LockGuard
* 资源合并管理 LockManager

## 使用

### 初始化

使用前需要初始化 Redis 实例.

```typescript
import Redis, { Cluster } from 'ioredis';
import { init } from 'nstarter-lock';

const redis = new Redis();
init(redis);
```

### 分布式锁

`DistributedLock` 提供可重入的, 自动续期的分布式锁实现. 在 Redis 集群部署环境下将自动启用红锁算法.

```typescript
import { DistributedLock } from 'nstarter-lock';
const lock = new DistributedLock('key', {
    lockTimeout: 10000,								// 锁超时时间, 毫秒.
    acquireTimeout: 10000,							// 上锁最大等待时间, 毫秒.
    acquireAttemptsLimit: Number.POSITIVE_INFINITY,	// 上锁最大尝试次数.
    retryInterval: 10,								// 上锁重试间隔, 毫秒.
    refreshInterval: 8000,							// 锁续期周期, 除非释放锁或手动停止刷新, 否则会持续尝试续期. 设置为 0 停用该特性.
    externallyAcquiredIdentifier: randomUUID(),		// 分布式锁标识符, 设置相同标识符可实现锁重入, 详见测试用例.
    onLockLost: Logger.warn							// 续期失败导致锁丢失时的回调函数.
});

// 加锁.
await lock.acquire();
// 解锁.
await lock.release();

// 停止自动续期.
await lock.stopRefresh();
```

### 分布式信号量

`DistributedSemaphore` 提供自动续期的, 公平信号量实现. 在 Redis 集群部署环境下将自动启用红锁算法.

```typescript
import { DistributedSemaphore } from 'nstarter-lock';
const semaphore = new DistributedSemaphore('key', 10, {
    lockTimeout: 10000,								// 信号量超时时间, 毫秒.
    acquireTimeout: 10000,							// 加信号量最大等待时间, 毫秒.
    acquireAttemptsLimit: Number.POSITIVE_INFINITY,	// 加信号量最大尝试次数.
    retryInterval: 10,								// 加信号量重试间隔, 毫秒.
    refreshInterval: 8000,							// 信号量续期周期, 除非释放信号量或手动停止刷新, 否则会持续尝试续期. 设置为 0 停用该特性.
});

// 加信号量.
await semaphore.acquire();
// 释放信号量.
await semaphore.release();

// 停止自动续期.
await semaphore.stopRefresh();
```

### LockGuard

`LockGuard` 参考 C++ 中 [std::lock_guard](https://en.cppreference.com/w/cpp/thread/lock_guard) 的实现思路, 为您管理锁的申请和释放.

传递给 `run` 的回调函数会在取锁成功后执行, 无论执行成功与否, 锁都会在执行结束后被释放.

当执行成功时, `run` 方法返回回调函数的返回值.

当执行失败时, `run` 方法在解锁后抛出回调函数的原始错误.

```typescript
import { LockGuard, DistributedLock } from 'nstarter-lock';

await LockGuard
    .withLock(new DistributedLock('key'))
    .run(async () => {
    	// -- snip --
	});
```

### LockManager

`LockManager` 为您合并多个资源操作.

`LockManager` 在内部通过对多个资源按 Key 的字符串排序实现以固定顺序获取的目的, 从而在一定程度上避免死锁的问题.

当多个资源中的一个获取失败时, `LockManager` 会逆序释放已经获取的资源.

`LockManger` 实现了 `IResource` 接口, 因此可以与 `LockGuard` 结合使用.

```typescript
import { LockManager, lockManager, DistributedLock, DistributedSemaphore } from 'nstarter-lock';

const lock1 = new DistributedLock('1');
const lock2 = new DistributedLock('2');
const semaphore = new DistributedSemaphore('3');

const lockManager = new LockManager([semaphore, lock2, lock1]);
await LockGuard
    .withLock(lockManager)
    .run(async () => {
    	// -- snip --
	});
```

