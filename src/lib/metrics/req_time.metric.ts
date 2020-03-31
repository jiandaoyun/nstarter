import { Counter } from 'prom-client';
import { BaseMetric } from '../index';
import { IReqLabels } from '../../types';

class ReqTimeMetric extends BaseMetric<Counter> {
    protected _metric =  new Counter({
        name: 'req_time_sum',
        help: 'Total Request Time',
        labelNames: ['method', 'status', 'path']
    });

    public inc(labels: IReqLabels, time: number) {
        this._metric.inc(labels, time);
    }
}

export const reqTimeMetric = new ReqTimeMetric().register();
