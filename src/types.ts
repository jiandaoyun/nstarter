import {
    ConsumeMessage,
    MessageProperties,
    MessagePropertyHeaders,
    Options
} from 'amqplib';
import { Priority } from './constants';

type Extend<Source, Target> = Omit<Source, keyof Target> & Target;
export type Delay = number;

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
export interface IProduceOptions extends Options.Publish {
    /**
     * 生产者配置
     */
    mandatory: boolean;
    persistent: boolean;
    deliveryMode: boolean;
    headers: IProduceHeaders;
    priority?: Priority;
    // 超时时间 TTL
    expiration?: number;
    pushRetryTimes?: number;
    pushRetryDelay?: number;
    // 延时添加到队列
    pushDelay?: number;
}

/**
 * consumer
 */

export type IQueueMessage<T> = Extend<ConsumeMessage, {
    content: IQueuePayload<T>,
    properties: Extend<MessageProperties, {
        headers: IProduceHeaders
    }>,
    runAt?: Date,
}>;

export interface IMessageHandler<T> {
    (payload: IQueueMessage<T>): void;
}
