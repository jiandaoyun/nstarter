import type { RequestHandler } from 'express';

import { monitorRegistry } from './lib';

/**
 * 监控数据采集页面
 * @param req
 * @param res
 * @param next
 */
export const metricsView: RequestHandler = async (req, res, next) => {
    res.set('Content-Type', monitorRegistry.contentType);
    return res.end(await monitorRegistry.metrics());
};
