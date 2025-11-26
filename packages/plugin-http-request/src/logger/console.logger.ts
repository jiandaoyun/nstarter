/**
 * 控制台日志记录器
 */

import {
    BaseLogger,
} from './base';
import { ELogLevel } from '../const';

/**
 * 控制台日志记录器
 */
export class ConsoleLogger extends BaseLogger {
    constructor(minLevel: ELogLevel = ELogLevel.INFO) {
        super(minLevel);
    }

    /**
     * 格式化日志消息
     * @param level 日志级别
     * @param message 消息
     * @param meta 元数据
     * @returns 格式化后的消息
     */
    private format(level: ELogLevel, message: string, meta?: Record<string, any>): string {
        const timestamp = new Date().toISOString();
        const metaStr = meta ? ` ${ JSON.stringify(meta) }` : '';
        return `[${ timestamp } ] [${ level.toUpperCase() }] ${ message }${ metaStr }`;
    }

    public debug(message: string, meta?: Record<string, any>): void {
        if (!this.shouldLog(ELogLevel.DEBUG)) {
            return;
        }
        console.debug(this.format(ELogLevel.DEBUG, message, meta));
    }

    public info(message: string, meta?: Record<string, any>): void {
        if (!this.shouldLog(ELogLevel.INFO)) {
            return;
        }
        console.info(this.format(ELogLevel.INFO, message, meta));
    }

    public warn(message: string, meta?: Record<string, any>): void {
        if (!this.shouldLog(ELogLevel.WARN)) {
            return;
        }
        console.warn(this.format(ELogLevel.WARN, message, meta));
    }

    public error(message: string, meta?: Record<string, any>): void {
        if (!this.shouldLog(ELogLevel.ERROR)) {
            return;
        }
        console.error(this.format(ELogLevel.ERROR, message, meta));
    }
}

