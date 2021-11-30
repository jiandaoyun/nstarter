import { BaseMetric } from '../index';
import { Counter } from 'prom-client';
import { IReqLabels } from '../../types';

class ReqCountMetric extends BaseMetric<Counter<string>> {
    protected _metric = new Counter({
        name: 'req_count_sum',
        help: 'Total Request Count',
        labelNames: ['method', 'status', 'path']
    });

    public inc(labels: IReqLabels) {
        this._metric.inc(labels);
    }
}

export const reqCountMetric = new ReqCountMetric().register();
