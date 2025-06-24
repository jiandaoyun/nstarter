/**
 * Copyright (c) 2015-2026, FineX, All Rights Reserved.
 * @author Kodomo
 * @date 2025/6/20
 */

/**
 * 抛出错误
 * @param err
 * @param options
 */
export function getNsError(err: Error, options?: {
    locker?: string | null
}): Error {
    const constructor = err.constructor as ErrorConstructor;
    return new constructor(`${ err.message } (locker: ${ options?.locker || 'unknown' })`);
}
