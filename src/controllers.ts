import { RequestHandler } from 'express';

import { monitorRegistry } from './lib';

/**
 * 监控数据采集页面
 * @param req
 * @param res
 * @param next
 */
export const metricsView: RequestHandler = (req, res, next) => {
    res.set('Content-Type', monitorRegistry.contentType);
    return res.end(monitorRegistry.metrics());
};
