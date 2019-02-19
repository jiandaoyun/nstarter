import _ from 'lodash';
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

// custom log formatter
const formatter = format.printf((info) => {
    let output = `${info.timestamp} - [${info.level}] ${info.message}`;
    if (info.error) {
        output = `${output}${os.EOL}\t${info.error.stack}`;
    }
    return output;
});

const levelFormatter = winston.format((info) => {
    info.level = info.level.toUpperCase();
    return info;
});

// console transport
transports.push(new winston.transports.Console({
    level: 'debug',
    stderrLevels: [LogLevel.error],
    consoleWarnLevels: [LogLevel.warn, LogLevel.debug],
    format: format.combine(
        levelFormatter(),
        winston.format.colorize(),
        format.timestamp(),
        formatter
    )
}));

// file transport
const baseFileLogOptions: DailyRotateFileTransportOptions = {
    dirname: './log/',
    zippedArchive: true,
    maxFiles: 1
};

transports.push(new RotateFileTransport({
    ...baseFileLogOptions,
    level: 'info',
    datePattern: 'YYYY-MM-DD',
    filename: 'deploy_%DATE%.log',
    format: format.combine(
        format.timestamp(),
        formatter
    )
}));

type LogMessage = string | Error;

winston.addColors(levelConf.colors);

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

    public debug(msg: LogMessage, meta?: object) {
        this._log('debug', msg, meta);
    }

    public info(msg: LogMessage, meta?: object) {
        this._log('info', msg, meta);
    }

    public warn(msg: LogMessage, meta?: object) {
        this._log('warn', msg, meta);
    }

    public error(msg: LogMessage, meta?: object) {
        this._log('error', msg, meta);
    }
}

export const logger = new Logger();
