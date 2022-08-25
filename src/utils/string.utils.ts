/*
 * Copyright (c) 2015-2022, FineX, All Rights Reserved.
 *
 * @author Mars.Du
 * @date 2022/8/25
 *
 */

/**
 * 生成 Bearer Token
 * @param {string} val - 令牌
 * @return {string} - Http 头部
 * @author Wanzhou
 */
export const genBearerToken = (val: string): string => `Bearer ${ val }`;
