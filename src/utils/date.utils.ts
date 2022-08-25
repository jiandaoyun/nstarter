/*
 * Copyright (c) 2015-2022, FineX, All Rights Reserved.
 *
 * @author Mars.Du
 * @date 2022/8/25
 *
 */

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
