import { Connection } from 'mongoose';

/**
 * Agenda 配置
 * @see https://github.com/rschmukler/agenda/blob/master/README.md
 * @see https://github.com/rschmukler/agenda/pull/331
 */
export interface IAgendaConf {
    readonly agenda: {
        name?: string,
        processEvery?: number | string,
        defaultConcurrency?: number,
        maxConcurrency?: number,
        defaultLockLifetime?: number,
        lockLimit?: number,
        sort?: any,
    };
    readonly mongodb: Connection;
    readonly collection: string;
    readonly onReady?: IReadyHandler;
    readonly onError?: IErrorHandler;
}

export interface IReadyHandler {
    (): any
}

export interface IErrorHandler {
    (err: Error): any
}
