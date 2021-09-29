import { ServerWriteableStream } from 'grpc';
import { UnaryCallback } from './grpc.client';

export interface IServerConfig {
    port: number;
}

/**
 * server unary call handler type
 */
export interface UnaryHandler<T, R> {
    (conf: T): Promise<R>;
}

/**
 * server server-streaming call handler type
 */
export interface ServerStreamingHandler<T, R> {
    (conf: T, call: ServerWriteableStream<R>): Promise<void>;
}

/**
 * gRPC handling methods type
 */
export type GrpcHandler<T, R> = UnaryHandler<T, R>
    | ServerStreamingHandler<T, R>;

