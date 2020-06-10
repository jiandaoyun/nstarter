import {
    ConsumeMessage,
    MessageProperties,
    MessagePropertyHeaders,
    Options
} from 'amqplib';
import { Priority, RetryMethod } from './constants';
import { RabbitMqQueue } from './lib/rabbitmq.queue';

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

/**
 * 消息体
 */
export interface IRabbitMqMessage {
    mqId?: string;
    seqNo?: number;
}

export type IQueuePayload<T = IRabbitMqMessage> = T extends IRabbitMqMessage ? T : number | string;

export interface IProduceHeaders extends MessagePropertyHeaders {
    'x-retry-times'?: number;
    'x-retry-delay'?: number;
    'x-p-timestamp'?: number;
}

/**
 * 生产消息配置
 */
export interface IProducerConfig<T> extends Options.Publish {
    /**
     * 生产者配置
     */
    headers?: IProduceHeaders;
    priority?: Priority;
    pushRetryTimes?: number;
    pushRetryDelay?: number;
    // 延时添加到队列
    pushDelay?: number;
    onPublish?(content: IQueuePayload<T>, queue: RabbitMqQueue<T>): void;
}

export interface IConsumerConfig<T> {
    retryTimes?: number;
    retryDelay?: number;
    retryMethod?: RetryMethod;
    timeout?: number;
    run(message: IQueueMessage<T>): Promise<void>;
    error?(err: Error, message: IQueueMessage<T>): void;
    onFinish?(message: IQueueMessage<T>, queue: RabbitMqQueue<T>): void;
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
