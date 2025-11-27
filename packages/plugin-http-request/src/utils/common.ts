/**
 * 延迟函数
 * @param ms 延迟毫秒数
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

/**
 * 超时函数
 * @param promise 原始 Promise
 * @param ms 超时毫秒数
 * @param message 超时错误消息
 * @returns 超时后的 Promise
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, message = 'Operation timed out'): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(message));
        }, ms);

        promise
            .then(resolve, reject)
            .finally(() => clearTimeout(timer));
    });
}
