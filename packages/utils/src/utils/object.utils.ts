/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author Henry.Zeng
 * @date 2023/4/6
 */
import { NULL } from './types';
import { isNil, isString, isObject } from './common.utils';

/**
 * 对象工具方法
 */
/**
 * 如果source中的属性在obj中不存在，obj中对象属性值为source
 * const obj = { a: 1 };
 * const res = NsUtils.defaults(obj, { a: 2, b: 3 };
 * console.log(res); => { a: 1, b: 3 }
 * console.log(obj); => { a: 1, b: 3 }
 * @param obj
 * @param source
 */
export const defaults = (obj: any | NULL, source: any | NULL) => {
    if (isNil(obj) || isNil(source)) {
        return source || obj || {};
    }
    for (const sourceKey in source) {
        if (isNil(obj[sourceKey])) {
            obj[sourceKey] = source[sourceKey];
        }
    }
    return obj;
};

/**
 * path只支持string或者string数组
 * 如果path是数组类型，并且obj上对应path的元素的路径不存在或者不是 Object 类型，使用{}覆写路径的值
 * NsUtils.set({ a: 1 }, 'b', 2) => { a: 1, b: 2 }
 * NsUtils.set({ a: 1 }, ['b'], 2) => { a: 1, b: 2 }
 * NsUtils.set({ a: 1 }, 'a', 2) => { a: 2 }
 * NsUtils.set({ a: 1, b: { c: 2 } }, ['b', 'd'], 3) => { a: 1, b: { c: 2, d: 3} }
 * NsUtils.set({ a: 1, b: [ 1, 2 ] } }, ['b', 'd'], 3) => { a: 1, b: { c: 2, d: 3} }
 * @param obj
 * @param path
 * @param value
 */
export const set = (obj: any | NULL, path: string | string[], value: any | NULL) => {
    if (isNil(obj)) {
        return obj;
    }
    if (isString(path)) {
        obj[path] = value;
    } else if (Array.isArray(path)) {
        const length = path.length, lastIndex = length - 1;
        let index = -1, nested = obj;
        while (++index < length) {
            const pathValue = path[index];
            if (!isString(pathValue)) {
                return obj;
            }
            if (index === lastIndex) {
                // 如果是path的最后一个元素，将value赋值给当前路径
                nested[pathValue] = value;
            } else {
                const nestValue = nested[pathValue];
                // 如果中间路径的值不是object，使用{}覆盖当前值
                if (!isObject(nestValue)) {
                    nested[pathValue] = {};
                }
                nested = nested[pathValue];
            }
        }
    }
    return obj;
};
