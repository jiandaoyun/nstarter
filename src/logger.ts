import os from 'os';
import winston, { format } from 'winston';
import Transport from 'winston-transport';
import RotateFileTransport, {
    DailyRotateFileTransportOptions
} from 'winston-daily-rotate-file';

export enum LogLevel {
    debug = 'debug',
    info = 'info',
    warn = 'warn',
    error = 'error'
}

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

const transports: Transport[] = [];

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
transports.push(consoleTransport);

// 文件日志输出
const baseFileLogOptions: DailyRotateFileTransportOptions = {
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
transports.push(fileTransport);

type LogMessage = string | Error;

winston.addColors(levelConf.colors);

/**
 * 日志管理
 */
class Logger {
    private _logger = winston.createLogger({
        transports,
        levels: levelConf.levels,
        exitOnError: false
    });

    private _log(level: string, msg: LogMessage, meta?: object) {
        if (typeof msg === 'string') {
            // log string
            this._logger.log(level, msg, meta);
        } else {
            // log error
            this._logger.log(level, msg.message, { ...meta, error: msg });
        }
    }

    public setLevel(level: LogLevel) {
        consoleTransport.level = level;
    }

    public debug(msg: LogMessage, meta?: object) {
        this._log(LogLevel.debug, msg, meta);
    }

    public info(msg: LogMessage, meta?: object) {
        this._log(LogLevel.info, msg, meta);
    }

    public warn(msg: LogMessage, meta?: object) {
        this._log(LogLevel.warn, msg, meta);
    }

    public error(msg: LogMessage, meta?: object) {
        this._log(LogLevel.error, msg, meta);
    }
}

export const logger = new Logger();
