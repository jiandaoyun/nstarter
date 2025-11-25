import escapeRegexp from 'escape-string-regexp';

/**
 * 根据域名列表生成正则表达式数组
 * 支持规则：
 *  1.全匹配 eg  `www.jiandaoyun.com`
 *  2.后缀匹配 eg `.jiandaoyun.com`
 *  3.前缀匹配 eg `172.168.0.`
 * @param domains
 */
export const createRegExpsByDomains = (domains: string[]): RegExp[] => {
    return domains.map((domain) => {
        if (domain.toLowerCase().startsWith('.')) { // 以.开头，生成后缀匹配正则
            return new RegExp(`${ escapeRegexp(domain) }$`);
        } else if (domain.toLowerCase().endsWith('.')) { // 以.结尾，生成前缀匹配正则
            return new RegExp(`^${ escapeRegexp(domain) }`);
        } else { // 字符串完全匹配
            return new RegExp(`^${ escapeRegexp(domain) }$`);
        }
    });
};