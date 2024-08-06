import type { Metric } from 'prom-client';
import { monitorRegistry } from '../registry';

export abstract class BaseMetric<T extends Metric<any>> {
    protected abstract _metric: T;
    protected _registry = monitorRegistry;

    public register() {
        this._registry.registerMetric(this.metric);
        return this;
    }

    public get metric() {
        return this._metric;
    }
}
