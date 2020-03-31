import { BaseMetric } from '../index';
import { Counter } from 'prom-client';
import { IFnLabels } from '../../types';

class FnCountMetric extends BaseMetric<Counter> {
    protected _metric = new Counter({
        name: 'fn_count_sum',
        help: 'Total Function Call Count',
        labelNames: ['method', 'class']
    });

    public inc(labels: IFnLabels) {
        this._metric.inc(labels);
    }
}

export const fnCountMetric = new FnCountMetric().register();
