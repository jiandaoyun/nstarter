/**
 * 通用工具方法
 */
import { promisify } from 'util';

import {
    nativeFunctionToString,
    nativeObjectToString,
    numberTag,
    objectProto,
    objectTag,
    RandomString
} from '../constants';
import { IPagination } from './types';

/**
 * 等待执行
 * @param timeMs
 */
export const sleep = async (timeMs: number) => {
    return promisify(setTimeout)(timeMs);
};

/**
 * 生成指定位数的随机码
 * @param length - 随机码长度
 * @param range - 随机码可选字符范围
 * @return 随机码
 */
export const randomString = (
    length: number,
    range: string = RandomString.alpha_numeric
): string => {
    const limit = range.length - 1;
    let result = '';
    for (let i = 0; i < length; ++i) {
        const randomIdx = Math.floor(Math.random() * limit);
        result += range[randomIdx];
    }
    return result;
};

/**
 * 生成枚举属性
 * @param key - 枚举 key
 * @param template - 枚举对象
 * @author kyle
 */
export const getEnumByKey = <E>(key: string, template: E) => {
    if (!key) {
        return;
    }
    return template[key as keyof E];
};

/**
 * 对参数进行 Base64 转码
 * @param payload - 需要转码的参数
 * @return Base64 编码的文本
 * @author kyle
 */
export const encodeBase64 = (payload: string): string => {
    if (!payload) {
        return '';
    }
    return Buffer.from(payload)
        .toString('base64');
};

/**
 * 对 Base64 文本解码
 * @param encoded - 需要解码的文本
 * @return Base64 解码后的文本
 * @author kyle
 */
export const decodeBase64 = (encoded: string): string => {
    if (!encoded) {
        return '';
    }
    return Buffer.from(encoded, 'base64')
        .toString();
};

/**
 * 生成分页查询参数
 * @param params - 请求查询参数
 * @param maxCount - 分页取数数量限制
 * @param defaultLimit - 分页取数数量默认值
 * @return - 分页查询参数
 * @author kyle
 */
export const getPagination = (params: {
    [key in keyof IPagination]?: IPagination[key]
} = {}, maxCount = 100, defaultLimit = 10): IPagination => {
    let skip = params.skip ? ~~params.skip || 0 : 0,
        limit = params.limit ? ~~params.limit || defaultLimit : defaultLimit;
    // skip >= 0
    skip = Math.max(0, skip);
    // 1 <= limit <= 100
    limit = Math.max(Math.min(maxCount, limit), 1);
    return { skip, limit };
};

/**
 * Check if `value` is null or undefined.
 * @param value
 */
export const isNil = (value?: any): value is null | undefined => {
    return value === null || value === undefined;
};

export const isString = (str: any): str is string => {
    return typeof str === 'string';
};

/**
 * 检查 value 是否是 类对象。 如果一个值是类对象，那么它不应该是 null，而且 typeof 后的结果是 "object"。
 * NsUtils.isObjectLike(null) => false
 * NsUtils.isObjectLike(new Set) => false
 * NsUtils.isObjectLike({}) => true
 * NsUtils.isObjectLike([1, 2, 3]) => true
 * @param obj
 */
export const isObjectLike = (obj: any): obj is object => {
    return obj !== null && typeof obj === 'object';
};

/**
 * 检查 value 是否为 Object 的language type。 (例如： arrays, functions, objects, regexes,new Number(0), 以及 new String(''))
 * NsUtils.isObjectLike(null) => false
 * NsUtils.isObjectLike(new Set) => true
 * NsUtils.isObjectLike({}) => true
 * NsUtils.isObjectLike([1, 2, 3]) => true
 * @param obj
 */
export const isObject = (obj: any): obj is object => {
    return obj !== null && (typeof obj === 'object' || typeof obj === 'function');
};

/**
 * 检查value是不是number的基本类型
 * NsUtils.isNumber(null) => false
 * NsUtils.isNumber(12) => true
 * NsUtils.isNumber('12') => false
 * NsUtils.isNumber(Number(12)) => true
 * NsUtils.isNumber(new Number(12)) => true
 * @param num
 */
export const isNumber = (num: any): num is number => {
    return typeof num === 'number' || (isObjectLike(num) && Object.prototype.toString.call(num) === numberTag);
};

/**
 * 检查 value 是否是普通对象。 也就是说该对象由 Object 构造函数创建，或者 [[Prototype]] 为 null 。
 * NsUtils.isPlainObject(null) => false
 * NsUtils.isPlainObject(12) => false
 * NsUtils.isPlainObject('12') => false
 * NsUtils.isPlainObject(new Set) => false
 * NsUtils.isPlainObject(new Set()) => false
 * NsUtils.isPlainObject([1, 2, 3]) => false
 * NsUtils.isPlainObject(Object.create(null)) => true
 * NsUtils.isPlainObject({}) => true
 * * @param obj
 */
export const isPlainObject = (obj: any): obj is object => {
    if (!isObjectLike(obj) || nativeObjectToString.call(obj) !== objectTag) {
        return false;
    }
    const proto = Object.getPrototypeOf(Object(obj));
    if (proto === null) {
        return true;
    }
    const Ctor = objectProto.hasOwnProperty.call(proto, 'constructor') && proto.constructor;
    return typeof Ctor === 'function' && Ctor instanceof Ctor &&
        nativeFunctionToString.call(Ctor) === nativeFunctionToString.call(Object);
};
