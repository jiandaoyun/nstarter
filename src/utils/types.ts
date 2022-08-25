export interface IPagination {
    skip: number;
    limit: number;
}

export enum DatetimeFormat {
    date = 'date',
    datetime = 'datetime',
    date_month = 'date_month',
    date_minute = 'date_minute'
}

export interface IDatetimeType  {
    type: DatetimeFormat;
    unit: 'month' | 'day' | 'minute' | 'second';
}

export type CorpId = string;
