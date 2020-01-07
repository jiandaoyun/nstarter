import _ from 'lodash';
import winston, { Logger as WinstonLogger } from 'winston';
import Transport from 'winston-transport';
import { RequestHandler, Request, Response } from 'express';

/**
 * 请求日志记录
 */
const requestLogger = winston.loggers.add('request', {});

export class RequestLogger {
    private static _formatRequest(req: Request, res: Response, duration: string) {
        return `${ req.ip } ${ req.method } ${ req.originalUrl } HTTP/${
            req.httpVersion } ${ res.statusCode || '-' } ${
            res.getHeader('content-length') || '-' } - ${ duration } ms`;
    }

    private static _logRequest(req: Request, res: Response, startAt: [number, number]) {
        const time = process.hrtime(startAt);
        const duration = (time[0] * 1e3 + time[1] * 1e-6).toFixed(3);
        const meta = {
            path: req.originalUrl,
            ip: req.ip,
            body: req.body,
            query: req.query,
            duration,
            status: res.statusCode,
            method: req.method,
            user_agent: _.get(req.headers, 'user-agent'),
            req_id: _.get(req.headers, 'request-id'),
            http_version: req.httpVersion
        };
        RequestLogger.log(RequestLogger._formatRequest(req, res, duration), meta);
    }

    public static registerTransport(transport: Transport): WinstonLogger {
        return requestLogger.add(transport);
    }

    public static log(msg: string, meta?: object) {
        requestLogger.log('info', msg, meta);
    }

    public static get middleware(): RequestHandler {
        return (req, res, next) => {
            const startAt = process.hrtime();
            const reqLogger = _.once(() => RequestLogger._logRequest(req, res, startAt));
            req.on('close', reqLogger);
            res.on('finish', reqLogger);
            return next();
        };
    }
}
