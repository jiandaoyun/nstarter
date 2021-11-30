import { Counter } from 'prom-client';
import { BaseMetric } from '../index';
import { IFnLabels } from '../../types';

class FnTimeMetric extends BaseMetric<Counter<string>> {
    protected _metric = new Counter({
        name: 'fn_time_sum',
        help: 'Total Function Call Time',
        labelNames: ['method', 'class']
    });

    public inc(labels: IFnLabels, time: number) {
        this._metric.inc(labels, time);
    }
}

export const fnTimeMetric = new FnTimeMetric().register();
