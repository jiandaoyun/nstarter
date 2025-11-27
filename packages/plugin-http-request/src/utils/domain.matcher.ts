import escapeRegexp from 'escape-string-regexp';

/**
 * 根据域名模式列表生成正则表达式数组
 * 支持规则：
 *  1. 完全匹配 eg `www.example.com`
 *  2. 后缀匹配 eg `.example.com`（匹配所有子域名）
 *  3. 前缀匹配 eg `172.168.0.`（主要用于 IP 地址匹配）
 * 
 * @param patterns 域名模式列表
 * @returns 正则表达式数组
 * 
 * @example
 * ```typescript
 * const regexps = createDomainMatchers(['example.com', '.example.com']);
 * regexps[0].test('example.com');  // true - 完全匹配
 * regexps[1].test('api.example.com');  // true - 后缀匹配
 * ```
 */
export const createDomainMatchers = (patterns: string[]): RegExp[] => {
    return patterns.map((pattern) => {
        const lowerPattern = pattern.toLowerCase();

        // 以 . 开头，生成后缀匹配正则（如 .example.com 匹配所有子域名）
        if (lowerPattern.startsWith('.')) {
            return new RegExp(`${ escapeRegexp(pattern) }$`, 'i');
        }

        // 以 . 结尾，生成前缀匹配正则（如 172.168.0. 匹配 172.168.0.x）
        if (lowerPattern.endsWith('.')) {
            return new RegExp(`^${ escapeRegexp(pattern) }`, 'i');
        }

        // 字符串完全匹配
        return new RegExp(`^${ escapeRegexp(pattern) }$`, 'i');
    });
};

