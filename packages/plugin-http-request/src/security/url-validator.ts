/**
 * URL 验证器
 */

import { URL } from 'node:url';
import type { UrlValidationResult } from '../types';

/**
 * URL 验证器类
 */
export class UrlValidator {
    private whitelist: string[];
    private blacklist: string[];

    constructor(whitelist: string[] = [], blacklist: string[] = []) {
        this.whitelist = whitelist;
        this.blacklist = blacklist;
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

        // 检查白名单（白名单优先）
        const inWhitelist = this.whitelist.length > 0 && this.matchesAny(hostname, this.whitelist);
        if (this.whitelist.length > 0 && !inWhitelist) {
            return {
                valid: false,
                url,
                inWhitelist: false,
                inBlacklist: false,
                reason: 'Domain is not in whitelist'
            };
        }

        // 检查黑名单
        const inBlacklist = this.matchesAny(hostname, this.blacklist);
        if (inBlacklist) {
            return {
                valid: false,
                url,
                inWhitelist,
                inBlacklist: true,
                reason: 'Domain is in blacklist'
            };
        }

        return {
            valid: true,
            url,
            inWhitelist,
            inBlacklist: false
        };
    }

    /**
     * 检查域名是否匹配任一模式
     * @param hostname 域名
     * @param patterns 模式列表（支持通配符）
     * @returns 是否匹配
     */
    private matchesAny(hostname: string, patterns: string[]): boolean {
        return patterns.some(pattern => this.matchesPattern(hostname, pattern));
    }

    /**
     * 检查域名是否匹配模式
     * @param hostname 域名
     * @param pattern 模式（支持通配符 *）
     * @returns 是否匹配
     */
    private matchesPattern(hostname: string, pattern: string): boolean {
        // 转换为小写进行比较
        const lowerHostname = hostname.toLowerCase();
        const lowerPattern = pattern.toLowerCase();

        // 完全匹配
        if (lowerHostname === lowerPattern) {
            return true;
        }

        // 通配符匹配
        if (lowerPattern.startsWith('*.')) {
            const domain = lowerPattern.slice(2); // 移除 *.
            // 匹配整个域名或子域名
            return lowerHostname === domain || lowerHostname.endsWith('.' + domain);
        }

        // 支持前缀通配符（如 test-*）
        if (lowerPattern.includes('*')) {
            const regex = new RegExp('^' + lowerPattern.replace(/\*/g, '.*') + '$');
            return regex.test(lowerHostname);
        }

        return false;
    }

    /**
     * 更新白名单
     * @param whitelist 新的白名单
     */
    public setWhitelist(whitelist: string[]): void {
        this.whitelist = whitelist;
    }

    /**
     * 更新黑名单
     * @param blacklist 新的黑名单
     */
    public setBlacklist(blacklist: string[]): void {
        this.blacklist = blacklist;
    }

    /**
     * 添加到白名单
     * @param patterns 要添加的模式
     */
    public addToWhitelist(...patterns: string[]): void {
        this.whitelist.push(...patterns);
    }

    /**
     * 添加到黑名单
     * @param patterns 要添加的模式
     */
    public addToBlacklist(...patterns: string[]): void {
        this.blacklist.push(...patterns);
    }

    /**
     * 从白名单移除
     * @param patterns 要移除的模式
     */
    public removeFromWhitelist(...patterns: string[]): void {
        this.whitelist = this.whitelist.filter(p => !patterns.includes(p));
    }

    /**
     * 从黑名单移除
     * @param patterns 要移除的模式
     */
    public removeFromBlacklist(...patterns: string[]): void {
        this.blacklist = this.blacklist.filter(p => !patterns.includes(p));
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
    }

    /**
     * 清空黑名单
     */
    public clearBlacklist(): void {
        this.blacklist = [];
    }
}

