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

/**
 * A specialized version of `_.filter` for arrays without support for
 * iteratee shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} predicate The function invoked per iteration.
 * @returns {Array} Returns the new filtered array.
 */
export const arrayFilter = <T = any>(
    array: T[] | NULL,
    predicate: (value: T, index: number, array: T[]) => boolean
) => {
    if (isNil(array)) {
        return [];
    }
    let index = -1, resIndex = 0;
    const length = array.length, result = [];

    while (++index < length) {
        const value = array[index];
        if (predicate(value, index, array)) {
            result[resIndex++] = value;
        }
    }
    return result;
};

export const arrayIncludes = <T = any>(
    array: T[] | NULL,
    value: T
): boolean => {
    if (isNil(array)) {
        return false;
    }
    let index = -1;
    const length = array.length;
    while(++index < length) {
        if(array[index] === value) {
            return true;
        }
    }
    return false;
};

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
export const arrayMap = <T = any, TResult = any>(
    array: T[],
    iteratee: (value: T, index: number, array: T[]) => TResult
): TResult[] => {
    let index = -1;
    const length = array === null ? 0 : array.length,
        result = Array(length);

    while (++index < length) {
        result[index] = iteratee(array[index], index, array);
    }
    return result;
};
