/**
 * 控制台日志记录器
 */


import {
    BaseLogger,
    ELogLevel
} from '../src';

// 测试logger
export class TestLogger extends BaseLogger {
    public logs: { level: ELogLevel; message: string; meta?: Record<string, any> }[] = [];

    public debug(message: string, meta?: Record<string, any>): void {
        if (this.shouldLog(ELogLevel.DEBUG)) {
            this.logs.push({ level: ELogLevel.DEBUG, message, meta });
        }
    }

    public info(message: string, meta?: Record<string, any>): void {
        if (this.shouldLog(ELogLevel.INFO)) {
            this.logs.push({ level: ELogLevel.INFO, message, meta });
        }
    }

    public warn(message: string, meta?: Record<string, any>): void {
        if (this.shouldLog(ELogLevel.WARN)) {
            this.logs.push({ level: ELogLevel.WARN, message, meta });
        }
    }

    public error(message: string, meta?: Record<string, any>): void {
        if (this.shouldLog(ELogLevel.ERROR)) {
            this.logs.push({ level: ELogLevel.ERROR, message, meta });
        }
    }
}

