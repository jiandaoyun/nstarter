import { v4 as uuidv4 } from 'uuid';
import { RequestHandler } from 'express';

/**
 * 请求参数扩展中间件
 * @param req
 * @param res
 * @param next
 */
export const requestExtensionMiddleware: RequestHandler = (req, res, next) => {
    // 请求完整路径
    req.originalPath = req.baseUrl + req.path;

    // 生成请求 id
    // note: 如果代理层未传入，则生成独立 uuid
    req.requestId = req.headers['x-request-id'] as string || uuidv4();

    // 用户客户端 UA
    const userAgent = req.headers['user-agent'] || '';
    req.userAgent = userAgent;
    res.locals.userAgent = userAgent;
};
