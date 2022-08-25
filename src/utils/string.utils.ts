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
 * 校验用户名是否合法
 * @param {string} val - 待校验用户名
 * @return {boolean} - 是否合法
 * @author kyle
 */
export const checkUsername = (val: string): boolean => /^[A-Za-z]+\w{2,}$/.test(val);

/**
 * 校验邮箱是否合法
 * @param {string} val - 待校验邮箱
 * @return {boolean} - 是否合法
 * @author sean
 */
export const checkEmail = (val: string): boolean => /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/.test(val);

/**
 * 校验 URL 是否合法
 * @param {string} val - 待校验 URL
 * @return {boolean} - 是否合法
 * @sse https://stackoverflow.com/questions/3809401/what-is-a-good-regular-expression-to-match-a-url
 * @author kyle
 */
export const checkUrl = (val: string): boolean => /^https?:\/\/[-a-zA-Z0-9@:%._+~#=]{2,256}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/.test(val);

/**
 * 根据 UA 判断是否为移动端
 * @param {string} UA - User Agent
 * @return {boolean} - 是否为移动设备
 * @author sean
 */
export const isMobileUA = (UA: string): boolean => {
    if (!UA) {
        return false;
    }
    return !!UA.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)
        || UA.indexOf('Android') > -1
        || UA.indexOf('Windows Phone') > -1
        || isMiniProgramUA(UA);
};

/**
 * 根据用户 UA 判断是否为微信内浏览器
 * @param {string} UA - User Agent
 * @return {boolean} - 是否为微信内置浏览器
 * @author sean
 */
export const isWechatUA = (UA: string): boolean => /MicroMessenger/i.test(UA);

/**
 * 根据用户 UA 判断是否为微信小程序内浏览器
 * @param {string} UA - User Agent
 * @return {boolean} - 是否为微信小程序内浏览器
 * @author sean
 */
export const isMiniProgramUA = (UA: string): boolean => /miniProgram/i.test(UA);

/**
 * 根据用户 UA 判断是否为企业微信内浏览器
 * @param {string} UA - User Agent
 * @return {boolean} - 是否为企业微信内置浏览器
 * @author sean
 */
export const isWxWorkUA = (UA: string): boolean => /wxwork/i.test(UA);

/**
 * 根据用户 UA 判断是否为钉钉内浏览器
 * @param {string} UA - User Agent
 * @return {boolean} - 是否为钉钉内置浏览器
 * @author sean
 */
export const isDingtalkUA = (UA: string): boolean => /DingTalk/i.test(UA);

/**
 * 判断用户 UA 是否是飞书内置浏览器
 * @param ua - User Agent
 */
export const isLarkUA = (ua: string): boolean => /Lark/i.test(ua);

/**
 * 是否为钉钉/企业微信客户端(PC/Mac/Mobile)
 * @param ua - User Agent
 */
export const isIntegrateClientUA = (
    ua: string
): boolean => isDingtalkUA(ua) || isWxWorkUA(ua) || isLarkUA(ua);

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
 * 判断 MIME 是否为图片类型
 * @param {string} mime - MIME
 * @return {boolean} - 是否为图片类型
 * @author vista
 */
export const isImgMime = (mime: string): boolean => !!mime && /^image/.test(mime);

/**
 * 生成 Bearer Token
 * @param {string} val - 令牌
 * @return {string} - Http 头部
 * @author Wanzhou
 */
export const genBearerToken = (val: string): string => `Bearer ${ val }`;

/**
 * 判断企业 Id 是否为钉钉企业
 * @param {string} corpId - 企业 Id
 * @return {boolean} - 是否为钉钉企业
 * @author kyle
 */
export const isDingtalkCorp = (corpId: CorpId): boolean => /^ding/.test(corpId);

/**
 * 判断企业 Id 是否为微信企业
 * @param {string} corpId - 企业 Id
 * @return {boolean} - 是否为微信企业
 * @author wujohns
 */
export const isWechatCorp = (corpId: CorpId): boolean => /^w/.test(corpId);

/**
 * 是否为企业微信密文企业.
 * @param corpId - 企业 Id.
 */
export const isWxWorkOpenCorp = (corpId: CorpId): boolean => /^wp/.test(corpId);

/**
 * 判断企业 Id 是否为飞书企业
 * @param corpId - 企业 Id
 */
export const isLarkCorp = (corpId: CorpId): boolean => /^lark/.test(corpId);
