import {
    ConsumeMessage,
    MessageProperties,
    MessagePropertyHeaders,
    Options
} from 'amqplib';
import { Priority, RetryMethod } from './constants';
import { BaseContext, ContextItem } from 'nstarter-core';

type Extend<Source, Target> = Omit<Source, keyof Target> & Target;

export interface RabbitMQConfig {
    readonly brokers: {
        readonly host: string,
        readonly port?: number
    }[];
    readonly protocol: string;
    readonly user: string;
    readonly password: string;
    readonly vhost?: string;
    // 链接配置
    readonly heartbeatInterval?: number;
    readonly reconnectInterval?: number;
    // 客户端配置
    readonly client?: {
        readonly [key: string]: any
    };
}

export type IQueuePayload<T> = T;

export type IQueueContext<T extends BaseContext> = T;

export interface IWrappedPayload<T, C extends BaseContext> {
    wrapped: true;
    _content: IQueuePayload<T>;
    _context: ContextItem;
}

export interface IProduceHeaders extends MessagePropertyHeaders {
    'x-retry-times'?: number;
    'x-retry-delay'?: number;
    'x-p-timestamp'?: number;
}

/**
 * 生产消息配置
 */
export interface IProducerConfig extends Options.Publish {
    /**
     * 生产者配置
     */
    headers?: IProduceHeaders;
    priority?: Priority;
    pushRetryTimes?: number;
    pushRetryDelay?: number;
}

export interface IConsumerConfig<T> {
    retryTimes?: number;
    retryDelay?: number;
    retryMethod?: RetryMethod;
    timeout?: number;
    run: {
        (message: IQueueMessage<T>): Promise<void>
    };
}

/**
 * consumer
 */

export type IQueueMessage<T> = Extend<ConsumeMessage, {
    content: IQueuePayload<T>,
    properties: Extend<MessageProperties, {
        headers: IProduceHeaders
    }>,
    duration?: number
}>;

export interface IMessageHandler<T> {
    (payload: IQueueMessage<T>): void;
}
