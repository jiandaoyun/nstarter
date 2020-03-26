import {
    ConsumeMessage,
    MessageProperties,
    MessagePropertyHeaders,
    Options
} from 'amqplib';
import { DelayLevel, Priority } from './constants';

type Extend<Source, Target> = Omit<Source, keyof Target> & Target;

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
    'x-retry-delay'?: DelayLevel;
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
    expiration?: string | number;
    pushRetryTimes?: number;
    pushDelay?: DelayLevel; // 延时添加到队列
    /**
     * 消费者配置
     */
    retryTimes?: number;
    retryDelay?: DelayLevel;
}

/**
 * consumer
 */

export type IQueueMessage<T> = Extend<ConsumeMessage, {
    content: IQueuePayload<T>,
    properties: Extend<MessageProperties, {
        headers: IProduceHeaders
    }>
}>;

export interface IMessageHandler<T> {
    (payload: IQueueMessage<T>): void;
}
