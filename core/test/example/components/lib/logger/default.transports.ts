import os from 'os';
import winston, { format } from 'winston';
import type Transport from 'winston-transport';

import { LogLevel } from '../../../../../src';

export const defaultTransports: Transport[] = [];

const formatter = format.printf((info) => {
    let output = `${ info.timestamp } - [${ info.level }] ${ info.message }`;
    if (info.error) {
        output = `${ output }${ os.EOL }\t${ (info.error as Error).stack }`;
    }
    return output;
});

const levelFormatter = winston.format((info) => {
    info.level = info.level.toUpperCase();
    return info;
});

const formats = [
    format.timestamp(),
    formatter
];
formats.unshift(winston.format.colorize());
formats.unshift(levelFormatter());
defaultTransports.push(new winston.transports.Console({
    level: LogLevel.info,
    stderrLevels: [LogLevel.error],
    consoleWarnLevels: [LogLevel.warn, LogLevel.debug],
    format: format.combine(...formats)
}));
