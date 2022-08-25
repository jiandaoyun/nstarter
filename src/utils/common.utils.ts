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
 * 获取枚举
 * @param value - 值
 * @param defaultValue - 默认值
 */
export const getEnum = <T>(
    value: unknown,
    defaultValue?: T
): T => (value || defaultValue) as unknown as T;

/**
 * 生成组件ID
 */
export const genWidgetId = () => `_widget_${ Date.now() }`;
