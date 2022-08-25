/*
 * Copyright (c) 2015-2022, FineX, All Rights Reserved.
 *
 * @author Mars.Du
 * @date 2022/8/25
 *
 */

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

