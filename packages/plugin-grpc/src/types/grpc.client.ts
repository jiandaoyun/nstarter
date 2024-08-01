import { ClientReadableStream } from '@grpc/grpc-js';

export interface IClientConfig {
    readonly package: string;
    readonly address: string;
    readonly useSsl: boolean;
    readonly servername?: string;
}

/**
 * 单参数请求回调
 */
export interface UnaryCallback<R> {
    (err: Error | null | undefined, result: R): any;
}

/**
 * 流式结果
 */
export type StreamResult<R> = ClientReadableStream<R> | null;
