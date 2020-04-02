import { ServerWriteableStream } from 'grpc';
import { UnaryCallback } from './grpc.client';

/**
 * server unary call handler type
 */
export interface UnaryHandler<T, R> {
    (conf: T, callback?: UnaryCallback<R>): void;
}

/**
 * server server-streaming call handler type
 */
export interface ServerStreamingHandler<T, R> {
    (conf: T, call: ServerWriteableStream<R>): void;
}

/**
 * gRPC handling methods type
 */
export type GrpcHandler<T, R> = UnaryHandler<T, R>
    | ServerStreamingHandler<T, R>;

