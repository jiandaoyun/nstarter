import type { Logger as WinstonLogger } from 'winston';
import winston from 'winston';
import type Transport from 'winston-transport';

const levelConf = {
    levels: {
        error: 20,
        warn: 50,
        info: 80,
        debug: 90
    },
    colors: {
        debug: 'cyan',
        info: 'green',
        warn: 'yellow',
        error: 'red'
    }
};

interface LogError extends Error {
    meta? : any;
}

type LogMessage = string | LogError;
winston.addColors(levelConf.colors);
const logger = winston.loggers.add('default', {
    levels: levelConf.levels,
    exitOnError: false
});
let metaKeyWhitelist: Set<string> = new Set();
let isWhitelistInitialized = false;

/**
 * 常规日志记录
 */
export class Logger {

    /**
     * 日志记录
     * @param level - 日志级别
     * @param msg - 日志消息
     * @param meta - 日志元数据
     */
    private static _log(level: string, msg: LogMessage, meta?: object) {
        const { logMeta, extra } = Logger.normalizeMetaKey(meta);
        if (typeof msg === 'string') {
            // log string
            logger.log(level, msg, {
                metadata: {
                    ...logMeta,
                    extra
                }
            });
        } else {
            // log error
            logger.log(level, msg.message, {
                metadata: {
                    ...logMeta,
                    error: msg,
                    extra: {
                        ...msg.meta,
                        ...extra
                    }
                }
            });
        }
    }

    /**
     * 规范化日志元数据key，将非白名单key转储到extra字段
     * @param meta - 日志元数据
     * @returns - 规范化后的日志元数据和额外字段
     */
    private static normalizeMetaKey(meta: object | undefined) {
        let logMeta = { ...meta };
        const extra: Record<string, any> = {};
        // 启用白名单控制.
        if (isWhitelistInitialized) {
            const whitelistMeta: Record<string, any> = {};
            for (const [key, value] of Object.entries(logMeta)) {
                if (metaKeyWhitelist.has(key)) {
                    // 白名单key才允许记录为顶层字段，其他key转储到extra字段
                    whitelistMeta[key] = value;
                } else {
                    extra[key] = value;
                }
            }
            logMeta = whitelistMeta;
        }
        return { logMeta, extra };
    }

    /**
     * 注册日志元数据key白名单
     * @param keyList - 日志元数据key白名单
     * @throws {Error} 如果已经初始化过
     */
    public static registerMetaKeyWhitelist(keyList: string[]) {
        if (isWhitelistInitialized) {
            throw new Error('Meta key whitelist is already initialized, cannot register again.');
        }
        metaKeyWhitelist = new Set(keyList);
        isWhitelistInitialized = true;
    }

    /**
     * 注册日志传输
     * @param transport - 日志传输
     * @returns WinstonLogger
     */
    public static registerTransport(transport: Transport): WinstonLogger {
        return logger.add(transport);
    }

    /**
     * 调试日志
     * @param msg - 日志消息
     * @param meta - 日志元数据
     */
    public static debug(msg: LogMessage, meta?: object) {
        Logger._log('debug', msg, meta);
    }

    /**
     * 信息日志
     * @param msg - 日志消息
     * @param meta - 日志元数据
     */
    public static info(msg: LogMessage, meta?: object) {
        Logger._log('info', msg, meta);
    }

    /**
     * 警告日志
     * @param msg - 日志消息
     * @param meta - 日志元数据
     */
    public static warn(msg: LogMessage, meta?: object) {
        Logger._log('warn', msg, meta);
    }

    /**
     * 错误日志
     * @param msg - 日志消息
     * @param meta - 日志元数据
     */
    public static error(msg: LogMessage, meta?: object) {
        Logger._log('error', msg, meta);
    }
}
