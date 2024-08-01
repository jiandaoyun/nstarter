import { v4 as uuidv4 } from 'uuid';
import { RequestHandler } from 'express';

/**
 * requestId 初始化中间件
 */
export const initRequestId = (): RequestHandler => {
    return (req, res, next) => {
        // 生成请求 id
        // note: 如果代理层未传入，则生成独立 uuid
        req.requestId = req.headers['x-request-id'] as string || uuidv4();

        return next();
    };
};
