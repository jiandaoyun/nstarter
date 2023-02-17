/**
 * 通用工具方法
 */
import { promisify } from 'util';

import { RandomString } from '../constants';
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
