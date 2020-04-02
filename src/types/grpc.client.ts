import { ServerReadableStream } from 'grpc';

export interface IClientConfig {
    readonly package: string;
    readonly address: string;
}

/**
 * 单参数请求回调
 */
export interface UnaryCallback<R> {
    (err: Error | null | undefined, result: R): any;
}

/**
 * 流式请求回调
 */
export interface StreamingCallback<R> {
    (err: Error | null | undefined, call: ServerReadableStream<R>): any;
}
