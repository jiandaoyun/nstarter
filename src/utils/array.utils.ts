/**
 * 数组处理工具方法
 */

import { NULL } from './types';
import { isNil } from './common.utils';

/**
 * Returns the last element of `array`.
 * @param array
 */
export const last = <T = any>(array?: T[]): T | undefined => {
    const length = isNil(array) ? 0 : array.length;
    return length ? array?.[length - 1] : undefined;
};

/**
 * Returns the first element of `array`.
 * @param array
 */
export const head = <T = any>(array?: T[]): T | undefined => {
    return array?.length ? array[0] : undefined;
};

/**
 * Returns and remove the first element of `array`.
 * @param array
 */
export const shift = <T = any>(array?: T[]): T | undefined => {
    return array?.length && array.shift ? array.shift() : undefined;
};

/**
 * A promisify version of `forEach` for arrays.
 * With this method, you can use `await` to wait for the iteration to complete.
 * Iteratee functions may exit iteration early by explicitly returning `false`.
 *
 * @param array - The array to iterate over.
 * @param iteratee - The function invoked per iteration.
 */
export const arrayEach = async <T = any>(
    array: T[] | NULL,
    iteratee: (value: T, index: number, array: T[]) => Promise<unknown>
) => {
    if (isNil(array)) {
        return array;
    }
    let index = -1;
    const length = array.length;
    while (++index < length) {
        if (await iteratee(array[index], index, array) === false) {
            break;
        }
    }
    return array;
};
