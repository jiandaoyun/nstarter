import { labelValues } from 'prom-client';

export interface IReqLabels extends labelValues {
    method: string;
    status: number;
    path: string;
}

export interface IFnLabels extends labelValues {
    class: string;
    method: string;
}
