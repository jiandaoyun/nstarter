import type { LabelValues } from 'prom-client';

export interface IReqLabels extends LabelValues<string> {
    method: string;
    status: number;
    path: string;
}

export interface IFnLabels extends LabelValues<string> {
    class: string;
    method: string;
}
