import os from 'os';
import { Logger, LogLevel } from 'nstarter-core';
import winston, { format } from 'winston';
import RotateFileTransport from 'winston-daily-rotate-file';

// 自定义日志格式化
const formatter = format.printf((info) => {
    let output = `${ info.timestamp } - [${ info.level }] ${ info.message }`;
    if (info.error) {
        output = `${ output }${ os.EOL }\t${ info.error.stack }`;
    }
    return output;
});

const levelFormatter = winston.format((info) => {
    info.level = info.level.toUpperCase();
    return info;
});

// 控制台日志输出
const consoleTransport = new winston.transports.Console({
    level: LogLevel.info,
    stderrLevels: [LogLevel.error],
    consoleWarnLevels: [LogLevel.warn, LogLevel.debug],
    format: format.combine(
        levelFormatter(),
        winston.format.colorize(),
        format.timestamp(),
        formatter
    )
});

// 文件日志输出
const baseFileLogOptions = {
    dirname: './log/',
    zippedArchive: true,
    maxFiles: 1
};

const fileTransport = new RotateFileTransport({
    ...baseFileLogOptions,
    level: LogLevel.debug,
    datePattern: 'YYYY-MM-DD',
    filename: 'deploy_%DATE%.log',
    format: format.combine(
        format.timestamp(),
        formatter
    )
});

/**
 * 初始化日志组件
 */
export const initLogger = () => {
    Logger.registerTransport(consoleTransport);
    Logger.registerTransport(fileTransport);
};

/**
 * 修改 console 日志级别
 * @param level - 控制台日志级别，默认：info
 */
export const setLogLevel = (level = LogLevel.info) => {
    consoleTransport.level = level;
};
