/**
 * 控制台日志记录器
 */

import {
    BaseLogger,
    LogLevel
} from './base';

/**
 * 控制台日志记录器
 */
export class ConsoleLogger extends BaseLogger {
    constructor(minLevel: LogLevel = LogLevel.INFO) {
        super(minLevel);
    }

    /**
     * 格式化日志消息
     * @param level 日志级别
     * @param message 消息
     * @param meta 元数据
     * @returns 格式化后的消息
     */
    private format(level: LogLevel, message: string, meta?: Record<string, any>): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${ JSON.stringify(meta) }` : '';
        return `[${ timestamp } ] [${ level.toUpperCase() }] ${ message }${ metaStr }`;
    }

    public debug(message: string, meta?: Record<string, any>): void {
        if (!this.shouldLog(LogLevel.DEBUG)) {
            return;
        }
        console.debug(this.format(LogLevel.DEBUG, message, meta));
    }

    public info(message: string, meta?: Record<string, any>): void {
        if (!this.shouldLog(LogLevel.INFO)) {
            return;
        }
        console.info(this.format(LogLevel.INFO, message, meta));
    }

    public warn(message: string, meta?: Record<string, any>): void {
        if (!this.shouldLog(LogLevel.WARN)) {
            return;
        }
        console.warn(this.format(LogLevel.WARN, message, meta));
    }

    public error(message: string, meta?: Record<string, any>): void {
        if (!this.shouldLog(LogLevel.ERROR)) {
            return;
        }
        console.error(this.format(LogLevel.ERROR, message, meta));
    }
}

