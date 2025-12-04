import escapeRegexp from 'escape-string-regexp';

/**
 * 根据域名模式列表生成正则表达式数组（通配符模式）
 * 支持规则：
 *  1. 通配符匹配 eg `*.example.com`（只匹配一级子域名，不包括根域名和多级子域名）
 *  2. 精确匹配 eg `example.com`（仅匹配指定域名）
 *
 * @param patterns 域名模式列表
 * @returns 正则表达式数组
 *
 * @example
 * ```typescript
 * const regexps = createDomainMatchers(['example.com', '*.example.com']);
 * regexps[0].test('example.com');          // true - 精确匹配
 * regexps[1].test('api.example.com');      // true - 通配符匹配一级子域名
 * regexps[1].test('test.api.example.com'); // false - 不匹配多级子域名
 * regexps[1].test('example.com');          // false - 不匹配根域名
 * ```
 */
export const createDomainMatchers = (patterns: string[]): RegExp[] => {
    return patterns.map((pattern) => {
        const trimmedPattern = pattern.trim();

        // 通配符模式：*.example.com
        // 只匹配一级子域名（如 api.example.com, www.example.com）
        // 不匹配根域名（example.com）和多级子域名（test.api.example.com）
        if (trimmedPattern.startsWith('*.')) {
            const domain = trimmedPattern.slice(2); // 移除 *. 前缀
            const escapedDomain = escapeRegexp(domain);
            // 匹配：一个或多个非点字符（一级子域名）+ 点 + 域名
            return new RegExp(`^[^.]+\\.${ escapedDomain }$`, 'i');
        }

        // 精确匹配：example.com
        // 仅匹配指定的域名
        const escapedPattern = escapeRegexp(trimmedPattern);
        return new RegExp(`^${ escapedPattern }$`, 'i');
    });
};

/**
 * 根据域名模式列表生成正则表达式数组（传统模式，用于正向代理等场景）
 * @TODO 需要存量用户跑完正向代理兼容后切换到通配符模式. 
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
 * const regexps = createLegacyDomainMatchers(['example.com', '.example.com']);
 * regexps[0].test('example.com');  // true - 完全匹配
 * regexps[1].test('api.example.com');  // true - 后缀匹配
 * ```
 */
export const createLegacyDomainMatchers = (patterns: string[]): RegExp[] => {
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

