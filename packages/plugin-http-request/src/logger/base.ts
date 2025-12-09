/**
 * 日志记录器基础接口和实现
 */

import type { ILogger } from '../types';
import { ELogLevel } from '../const';

/**
 * 抽象日志记录器基类
 */
export abstract class BaseLogger implements ILogger {
    protected minLevel: ELogLevel;

    constructor(minLevel: ELogLevel = ELogLevel.INFO) {
        this.minLevel = minLevel;
    }

    /**
     * 检查日志级别是否应该记录
     * @param level 日志级别
     * @returns 是否应该记录
     */
    protected shouldLog(level: ELogLevel): boolean {
        const levels = [ELogLevel.DEBUG, ELogLevel.INFO, ELogLevel.WARN, ELogLevel.ERROR];
        const minLevelIndex = levels.indexOf(this.minLevel);
        const currentLevelIndex = levels.indexOf(level);
        return currentLevelIndex >= minLevelIndex;
    }

    /**
     * 设置最小日志级别
     * @param level 最小日志级别
     */
    public setMinLevel(level: ELogLevel): void {
        this.minLevel = level;
    }

    /**
     * 获取当前最小日志级别
     * @returns 最小日志级别
     */
    public getMinLevel(): ELogLevel {
        return this.minLevel;
    }

    public abstract debug(message: string, meta?: Record<string, any>): void;

    public abstract info(message: string, meta?: Record<string, any>): void;

    public abstract warn(message: string, meta?: Record<string, any>): void;

    public abstract error(message: string, meta?: Record<string, any>): void;
}

/**
 * 空日志记录器（不记录任何日志）
 */
export class NullLogger implements ILogger {
    public debug(): void {
        // 不做任何事
    }

    public info(): void {
        // 不做任何事
    }

    public warn(): void {
        // 不做任何事
    }

    public error(): void {
        // 不做任何事
    }
}

