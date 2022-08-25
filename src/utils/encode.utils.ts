/*
 * Copyright (c) 2015-2022, FineX, All Rights Reserved.
 *
 * @author Mars.Du
 * @date 2022/8/25
 *
 */

/**
 * 字符串转unicode编码
 * @param str
 */
export const str2Unicode = (str: string) => {
    let codeStr = '';
    for (let i = 0; i < str.length; i++) {
        const _code = str.charCodeAt(i).toString(16).toLowerCase();
        codeStr += '\\u' + '0000'.substr(0, 4 - _code.length) + _code;
    }
    return codeStr;
};
