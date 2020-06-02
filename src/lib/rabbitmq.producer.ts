import _ from 'lodash';
import retry from 'async-retry';
import { Options } from 'amqplib';

import { CustomProps, DefaultConfig, Priority, RabbitProps } from '../constants';
import { IProduceHeaders, IProduceOptions, IQueuePayload } from '../types';
import { RabbitMqQueue } from './rabbitmq.queue';

export interface IProducerConfig<T> extends Partial<IProduceOptions> {
    onPublish?(queue: RabbitMqQueue<T>, content: IQueuePayload<T>): Promise<void>;
}

export interface IQueueProducer<T> {
    publish(content: IQueuePayload<T>, options?: Partial<IProduceOptions>): Promise<void>;
    setup(): Promise<void>;
}

/**
 * 队列生产者
 *
 * @property _queue - 队列
 * @property _options - 配置属性
 * @property _options.retryTimes - 消费端生效：消费失败重试次数
 * @property _options.retryDelay - 消费端生效：消费重试前的延时时间等级
 * @property _options.pushRetryTimes - 生产端生效：消息 publish 失败后重试次数
 * @property _options.pushDelay - 生产端生效：延时 publish 时间，单位：MS
 * @property _options.expiration - 消费端生效：消息投递超时时长，超过时间未被消费，会被删除
 */
class RabbitMqProducer<T> implements IQueueProducer<T> {
    protected readonly _options: Partial<IProduceOptions>;
    protected readonly _queue: RabbitMqQueue<T>;

    constructor(queue: RabbitMqQueue<T>, options: IProducerConfig<T>) {
        this._queue = queue;
        this._options = {
            pushRetryTimes: 0,
            pushDelay: 0,
            expiration: DefaultConfig.DeliverTTL,
            ...options
        }
    }

    /**
     * 格式化消息生产配置
     * @return {Options.Publish}
     * @private
     */
    protected _getProduceOptions(): Options.Publish {
        const o = this._options;
        const publishOpts: Options.Publish = {
            mandatory: true,
            persistent: true,
            deliveryMode: true,
            ...o
        };
        const headers: IProduceHeaders = o.headers || {};
        // 设置消息过期时间（TTL），到期会自动被队列中删除，不会被消费者消费
        if (o.expiration && o.expiration > 0) {
            publishOpts.expiration = o.expiration;
        }
        // 消费重试计数器
        headers[CustomProps.retryTimes] = 0;
        // 延迟推送策略
        if (o.pushDelay) {
            headers[RabbitProps.messageDelay] = o.pushDelay;
        }
        // 记录发起时间
        headers[CustomProps.produceTimestamp] = Date.now();
        return {
            ...publishOpts,
            headers,
            priority: o.priority || Priority.Normal
        };
    }

    /**
     * 发送队列消息
     * @param {IQueuePayload<T>} content - 内容
     * @return {Promise<void>}
     */
    public async publish(content: IQueuePayload<T>): Promise<void> {
        const o = this._options;
        const publishOpts = this._getProduceOptions();
        return retry(async () => {
            return this._queue.publish(content, publishOpts);
        }, {
            retries: o.pushRetryTimes
        });
    }

    /**
     * 队列生产者启动方法
     */
    public async setup(): Promise<void> {
        return this._queue.waitForSetup();
    }
}

/**
 * 生成队列生产者的工厂方法
 * @param queue
 * @param options
 */
export const queueProducerFactory = <T>(queue: RabbitMqQueue<T>, options: IProducerConfig<T> = {}):
    RabbitMqProducer<T> => new RabbitMqProducer<T>(queue, options);
