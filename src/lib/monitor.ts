import { IFnLabels, IReqLabels } from '../types';
import { reqCountMetric, reqTimeMetric, fnCountMetric, fnTimeMetric } from './metrics';

export class MetricsMonitor {
    public static recordRequest(labels: IReqLabels, time: number) {
        reqCountMetric.inc(labels);
        reqTimeMetric.inc(labels, time);
    }

    public static recordFunction(labels: IFnLabels, time: number) {
        fnCountMetric.inc(labels);
        fnTimeMetric.inc(labels, time);
    }
}
