import {
    ConsumeMessage,
    MessageProperties,
    MessagePropertyHeaders,
    Options
} from 'amqplib';
import { Priority, RetryMethod } from './constants';

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
}

export type IQueuePayload<T> = T;

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
    // 延时添加到队列
    pushDelay?: number;
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
