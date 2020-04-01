import { IFnLabels, IReqLabels } from '../types';
import { reqCountMetric, reqTimeMetric, fnCountMetric, fnTimeMetric } from './metrics';

export class MetricsMonitor {
    public recordRequest(labels: IReqLabels, time: number) {
        reqCountMetric.inc(labels);
        reqTimeMetric.inc(labels, time);
    }

    public recordFunction(labels: IFnLabels, time: number) {
        fnCountMetric.inc(labels);
        fnTimeMetric.inc(labels, time);
    }
}

export const metricsMonitor = new MetricsMonitor();
