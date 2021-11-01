import winston, { Logger as WinstonLogger } from 'winston';
import Transport from 'winston-transport';
import { RequestHandler, Request, Response } from 'express';
import { LogLevel } from '../constants';
import {once} from '../utils';

/**
 * 请求日志记录
 */
const requestLogger = winston.loggers.add('request', {});

export interface IRequestMeta {
    path: string;
    ip: string;
    body: any;
    query: any;
    duration: number;
    status: number;
    method: string;
    user_agent?: string;
    req_id?: string;
    http_version: string;
}

export interface IRequestMetaFormatter {
    (req: Request, res: Response, meta: IRequestMeta): IRequestMeta;
}

let metaFormatter: IRequestMetaFormatter =
    (req, res, meta) => meta;

export class RequestLogger {
    private static _formatRequest(req: Request, res: Response, duration: number) {
        return `${ req.ip } ${ req.method } ${ req.originalUrl } HTTP/${
            req.httpVersion } ${ res.statusCode || '-' } ${
            res.getHeader('content-length') || '-' } - ${ duration } ms`;
    }

    private static _logRequest(
        req: Request,
        res: Response,
        startTime: number
    ): void {
        const duration = Date.now() - startTime;
        const { headers } = req;
        const baseMeta = {
            path: req.originalUrl,
            ip: req.ip,
            body: req.body,
            query: req.query,
            duration,
            status: res.statusCode,
            method: req.method,
            user_agent: headers['user-agent'],
            http_version: req.httpVersion,
            req_id: req.requestId,
            session_id: req.sessionID,
            start_time: startTime
        };
        const meta = metaFormatter(req, res, baseMeta);
        RequestLogger.log(RequestLogger._formatRequest(req, res, duration), meta);
    }

    public static setMetaFormatter(formatter: IRequestMetaFormatter) {
        metaFormatter = formatter;
    }

    public static registerTransport(transport: Transport): WinstonLogger {
        return requestLogger.add(transport);
    }

    public static log(msg: string, meta?: object) {
        requestLogger.log('info', msg, {
            metadata: meta
        });
    }

    public static logError(level: LogLevel, err: Error, extra?: object) {
        requestLogger.log(level, err.message, {
            metadata: { ...extra, err }
        });
    }

    public static get middleware(): RequestHandler {
        return (req, res, next) => {
            const startTime = Date.now();
            const reqLogger = once(() => RequestLogger._logRequest(req, res, startTime));
            req.on('close', reqLogger);
            res.on('finish', reqLogger);
            return next();
        };
    }
}
