import _ from 'lodash';
import winston, { Logger as WinstonLogger } from 'winston';
import Transport from 'winston-transport';

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

type LogMessage = string | Error;
winston.addColors(levelConf.colors);
const logger = winston.loggers.add('default', {
    levels: levelConf.levels,
    exitOnError: false
});
/**
 * 常规日志记录
 */
export class Logger {
    private static _log(level: string, msg: LogMessage, meta?: object) {
        if (typeof msg === 'string') {
            // log string
            logger.log(level, msg, {
                metadata: meta
            });
        } else {
            // log error
            logger.log(level, msg.message, {
                metadata: {
                    ...meta,
                    error: msg,
                    extra: {
                        ..._.get(msg, 'meta')
                    }
                }
            });
        }
    }

    public static registerTransport(transport: Transport): WinstonLogger {
        return logger.add(transport);
    }

    public static debug(msg: LogMessage, meta?: object) {
        Logger._log('debug', msg, meta);
    }

    public static info(msg: LogMessage, meta?: object) {
        Logger._log('info', msg, meta);
    }

    public static warn(msg: LogMessage, meta?: object) {
        Logger._log('warn', msg, meta);
    }

    public static error(msg: LogMessage, meta?: object) {
        Logger._log('error', msg, meta);
    }
}
