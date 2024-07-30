import agent from 'elastic-apm-node';

export interface ITransactionOptions {
    type?: string;
    labels?: {
        [key: string]: string | number | boolean | null | undefined
    };
}

export interface ISpanOptions {
    type?: string;
    subtype?: string;
    action?: string;
    labels?: {
        [key: string]: string | number | boolean | null | undefined
    };
}

// apm 包目前没有抛出类型，hack 处理
export type Agent = typeof agent;
export type Transaction = Exclude<typeof agent.currentTransaction, null>;
export type Span = Exclude<typeof agent.currentSpan, null>;
