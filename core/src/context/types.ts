import type { Request } from 'express';

export interface ContextItem {
    [key: string]: any;
}

export interface IRequestContextIdGenerator {
    (req: Request): string;
}

export interface IContextMiddlewareOptions {
    idGenerator?: IRequestContextIdGenerator;
}
