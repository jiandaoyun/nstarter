/**
 * URL 验证器
 */

import { URL } from 'node:url';
import type { UrlValidationResult } from '../types';
import { DomainUtils } from '../utils';

/**
 * URL 验证器类
 */
export class UrlValidator {
    private whitelist: string[];
    private blacklist: string[];
    private whitelistRegexps: RegExp[];
    private blacklistRegexps: RegExp[];

    constructor(whitelist: string[] = [], blacklist: string[] = []) {
        this.whitelist = whitelist;
        this.blacklist = blacklist;
        // 预生成正则表达式，提高匹配性能和安全性
        this.whitelistRegexps = DomainUtils.createDomainMatchers(whitelist);
        this.blacklistRegexps = DomainUtils.createDomainMatchers(blacklist);
    }

    /**
     * 验证 URL
     * @param url URL 字符串
     * @returns 验证结果
     */
    public validate(url: string): UrlValidationResult {
        let parsedUrl: URL;

        try {
            parsedUrl = new URL(url);
        } catch {
            return {
                valid: false,
                url,
                inWhitelist: false,
                inBlacklist: false,
                reason: 'Invalid URL format'
            };
        }

        // 只允许 http 和 https 协议
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return {
                valid: false,
                url,
                inWhitelist: false,
                inBlacklist: false,
                reason: `Protocol ${ parsedUrl.protocol } is not allowed. Only http and https are supported.`
            };
        }

        const hostname = parsedUrl.hostname;

        // 检查白名单（使用预生成的正则表达式）
        const inWhitelist = this.matchesAny(hostname, this.whitelistRegexps);
        // 检查黑名单（使用预生成的正则表达式）
        const inBlacklist = this.matchesAny(hostname, this.blacklistRegexps);

        // 配了白名单, 优先使用白名单模式, 在名单内的域名通过, 其余拒绝.
        // 同时配有黑名单, 黑名单辅助拒绝其余通过的域名.
        if (this.whitelist.length > 0 && !inWhitelist) {
            return {
                valid: false,
                url,
                inWhitelist,
                inBlacklist,
                reason: 'Domain is not in whitelist'
            };
        }

        // 配了黑名单, 使用黑名单模式, 在黑名单内的域名拒绝, 其余通过.
        if (this.blacklist.length > 0 && inBlacklist) {
            return {
                valid: false,
                url,
                inWhitelist,
                inBlacklist,
                reason: 'Domain is in blacklist'
            };
        }

        // 黑白名单没配的, 默认通过.
        return {
            valid: true,
            url,
            inWhitelist,
            inBlacklist
        };
    }

    /**
     * 检查域名是否匹配任一模式（使用预生成的正则表达式）
     * @param hostname 域名
     * @param regexps 正则表达式列表
     * @returns 是否匹配
     */
    private matchesAny(hostname: string, regexps: RegExp[]): boolean {
        return regexps.some(regex => regex.test(hostname));
    }

    /**
     * 更新白名单
     * @param whitelist 新的白名单
     */
    public setWhitelist(whitelist: string[]): void {
        this.whitelist = whitelist;
        this.whitelistRegexps = DomainUtils.createDomainMatchers(whitelist);
    }

    /**
     * 更新黑名单
     * @param blacklist 新的黑名单
     */
    public setBlacklist(blacklist: string[]): void {
        this.blacklist = blacklist;
        this.blacklistRegexps = DomainUtils.createDomainMatchers(blacklist);
    }

    /**
     * 添加到白名单
     * @param patterns 要添加的模式
     */
    public addToWhitelist(...patterns: string[]): void {
        this.whitelist.push(...patterns);
        this.whitelistRegexps = DomainUtils.createDomainMatchers(this.whitelist);
    }

    /**
     * 添加到黑名单
     * @param patterns 要添加的模式
     */
    public addToBlacklist(...patterns: string[]): void {
        this.blacklist.push(...patterns);
        this.blacklistRegexps = DomainUtils.createDomainMatchers(this.blacklist);
    }

    /**
     * 从白名单移除
     * @param patterns 要移除的模式
     */
    public removeFromWhitelist(...patterns: string[]): void {
        this.whitelist = this.whitelist.filter(p => !patterns.includes(p));
        this.whitelistRegexps = DomainUtils.createDomainMatchers(this.whitelist);
    }

    /**
     * 从黑名单移除
     * @param patterns 要移除的模式
     */
    public removeFromBlacklist(...patterns: string[]): void {
        this.blacklist = this.blacklist.filter(p => !patterns.includes(p));
        this.blacklistRegexps = DomainUtils.createDomainMatchers(this.blacklist);
    }

    /**
     * 获取白名单
     * @returns 白名单副本
     */
    public getWhitelist(): string[] {
        return [...this.whitelist];
    }

    /**
     * 获取黑名单
     * @returns 黑名单副本
     */
    public getBlacklist(): string[] {
        return [...this.blacklist];
    }

    /**
     * 清空白名单
     */
    public clearWhitelist(): void {
        this.whitelist = [];
        this.whitelistRegexps = [];
    }

    /**
     * 清空黑名单
     */
    public clearBlacklist(): void {
        this.blacklist = [];
        this.blacklistRegexps = [];
    }
}

