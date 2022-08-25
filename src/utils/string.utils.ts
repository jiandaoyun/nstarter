/*
 * Copyright (c) 2015-2022, FineX, All Rights Reserved.
 *
 * @author Mars.Du
 * @date 2022/8/25
 *
 */

import { CorpId } from './types';

/**
 * 生成模糊匹配 标点符号的字符串
 * @param {string} text - 待检查的字符串
 * @return {string} - 替换后的字符串
 * @description  模糊匹配的符号有中文的逗号、左右括号
 * @author Avery.Lee
 */
export const convertToFuzzyMatchPunctuationRegex = (text: string): string => {
    if (text) {
        return '^' + text.replace(/([（），,\*\-\.\$\^\(\)\[\]\{\}\|\+\?\\])/g, (matchStr) => {
            if (matchStr === '(' || matchStr === '（') {
                return '[（(]';
            } else if (matchStr === ')' || matchStr === '）') {
                return '[）)]';
            } else if (matchStr === ',' || matchStr === '，') {
                return '[，,]';
            } else {
                return '\\' + matchStr;
            }
        });
    } else {
        return '';
    }
};


/**
 * 子字段解析
 * @param {string} widgetName - 字段名
 * @return {Object} - 解析结果
 * @author Wanzhou
 */
export const parseSubformField = (widgetName: string): {
    isSubField: false
} | {
    isSubField: true,
    subform: string,
    subField: string
} => {
    const match = `${ widgetName }`.match(
        /^((_widget_|_join_)\d+)[.%]((_widget_|_join_)\d+)$/
    );
    if (!match) {
        return {
            isSubField: false
        };
    }
    return {
        isSubField: true,
        subform: match[1],
        subField: match[3]
    };
};


/**
 * 生成 Bearer Token
 * @param {string} val - 令牌
 * @return {string} - Http 头部
 * @author Wanzhou
 */
export const genBearerToken = (val: string): string => `Bearer ${ val }`;
