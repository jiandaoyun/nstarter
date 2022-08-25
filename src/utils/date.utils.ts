/*
 * Copyright (c) 2015-2022, FineX, All Rights Reserved.
 *
 * @author Mars.Du
 * @date 2022/8/25
 *
 */

import { DatetimeFormat, IDatetimeType } from './types';

/**
 * 解析字符串时间的类型，日期、日期时间
 * @param {string} val - 待解析字符串
 * @return {Object} - 解析结果
 * @author Wanzhou
 */
export const getDatetimeType = (val = ''): IDatetimeType => {
    if (/^\d{4}-\d{1,2}$/.test(val)) {
        // YYYY-MM
        return {
            type: DatetimeFormat.date_month,
            unit: 'month'
        };
    }
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(val)) {
        // YYYY-MM-DD
        return {
            type: DatetimeFormat.date,
            unit: 'day'
        };
    }
    if (/^\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}$/.test(val)) {
        // YYYY-MM-DD HH:mm
        return {
            type: DatetimeFormat.date_minute,
            unit: 'minute'
        };
    }
    if (/^\d{4}-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}$/.test(val)) {
        // YYYY-MM-DD HH:mm:ss
        return {
            type: DatetimeFormat.datetime,
            unit: 'second'
        };
    }
    return {} as any;
};

/**
 * 获取下一个时间片的起始时间戳
 * @param currentTimestamp - 当前时间戳
 * @param timeSliceDuration - 一个时间片的时长
 */
export const getNextTimeSlice = (
    currentTimestamp: number,
    timeSliceDuration: number
): number => {
    return currentTimestamp - currentTimestamp % timeSliceDuration + timeSliceDuration;
};
