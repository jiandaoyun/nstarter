import { Metric } from 'prom-client';
import { monitorRegistry } from '../registry';

export abstract class BaseMetric<T extends Metric> {
    protected abstract _metric: T;
    protected _registry = monitorRegistry;

    public register() {
        this._registry.registerMetric(this.metric);
        return this.metric;
    }

    public get metric() {
        return this._metric;
    }
}
