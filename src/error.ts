import httpStatus from 'http-status';
import { LogLevel } from './constants';

interface ErrorOptions {
    meta?: any;
    httpCode?: number;
    wrapper?: Function;
}
export interface ErrorBuilder {
    (code: number, level?: LogLevel, options?: ErrorOptions): Error;
}

const errorMessages: Record<number, string> = {};

export const registerErrorMessages = (messages: Record<number, string>) => {
    Object.assign(errorMessages, messages);
};

export class NsError extends Error {
    public readonly isNsError = true;
    public readonly name: string;
    public readonly message: string;
    public readonly code: number;
    public readonly level: LogLevel;
    public readonly meta: any;
    public readonly httpCode: number;

    constructor(name: string, code: number, level?: LogLevel, options?: ErrorOptions) {
        super();
        this.name = name || this.constructor.name;
        this.code = code || 1;
        this.message = errorMessages[code] || 'Unknown Error';
        this.level = level || LogLevel.error;
        let trace = this.constructor;
        if (options) {
            this.meta = options.meta;
            this.httpCode = options.httpCode || httpStatus.BAD_REQUEST;
            trace = options.wrapper || this.constructor;
        }
        Error.captureStackTrace(this, trace);
    }
}
