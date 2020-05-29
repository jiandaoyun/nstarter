import _ from 'lodash';
import retry from 'async-retry';
import { Options } from 'amqplib';
import moment from 'moment';

import { CustomProps, DefaultConfig, Priority, RabbitProps } from '../constants';
import { DelayLevel, IProduceHeaders, IProduceOptions, IQueuePayload } from '../types';
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
            retryTimes: DefaultConfig.RetryTimes,
            retryDelay: DefaultConfig.RetryDelay,
            pushRetryTimes: 0,
            pushDelay: '0',
            expiration: DefaultConfig.DeliverTTL,
            ...options
        }
    }

    private _parseDelay(
        delay: DelayLevel
    ): { val: number, unit: 's' | 'm' | 'h' } {
        const o = this._options;
        const matches = `${ delay || o.pushDelay }`.match(/^(\d+)([smh])$/);
        return {
            val: _.parseInt(_.get(matches, '[1]')),
            unit: _.get(matches, '[2]')
        };
    }

    /**
     * 格式化消息生产配置
     * @param {IProduceOptions} options
     * @return {Options.Publish}
     * @private
     */
    protected _getProduceOptions(
        options: Partial<IProduceOptions>
    ): Options.Publish {
        const o = this._options;
        const publishOpts: Options.Publish = _.defaults(
            _.omit(options, [
                'pushDelay', 'retryTimes', 'retryDelay', 'headers', 'priority'
            ]),
            {
                mandatory: true,
                persistent: true,
                deliveryMode: true
            }
        );
        const headers: IProduceHeaders = options.headers || {},
            priority = options.priority || Priority.Normal;
        const retryTimes = options.retryTimes || o.retryTimes,
            retryDelay = options.retryDelay || o.retryDelay;
        if (retryTimes && retryDelay) {
            // 消费重试机制
            _.set(headers, CustomProps.consumeRetryTimes, retryTimes);
            _.set(headers, CustomProps.consumeRetryDelay, retryDelay);
        }
        if (o.expiration) {
            // 设置消息过期时间（TTL），到期会自动被队列中删除，不会被消费者消费
            publishOpts.expiration = o.expiration;
        }
        const pushDelay = options.pushDelay || o.pushDelay || '0';
        const { val, unit } = this._parseDelay(pushDelay),
            messageTtl = moment.duration(val, unit).asMilliseconds();
        if (messageTtl && _.isNumber(messageTtl)) {
            // 消费重试机制
            _.set(headers, RabbitProps.messageDelay, messageTtl);
        }
        // 记录发起时间
        _.set(headers, CustomProps.produceTimestamp, Date.now());
        _.extend(publishOpts, {
            headers,
            priority
        });
        return publishOpts;
    }

    /**
     * 消息发送
     * @param {IQueuePayload<T>} content
     * @param {IProduceOptions} options
     * @return {Promise<void>}
     * @private
     */
    protected async _publishWithRetry(
        content: IQueuePayload<T>,
        options: Partial<IProduceOptions>
    ): Promise<void> {
        const o = this._options;
        const formatOpts = this._getProduceOptions(options);
        // 至少重试 1 次发布到队列
        return retry(async () => {
            return this._queue.publish(content, formatOpts);
        }, {
            retries: o.pushRetryTimes || 1
        });
    }

    /**
     * 发送队列消息
     * @param {IQueuePayload<T>} content - 内容
     * @param {IProduceOptions} options - 参数
     * @return {Promise<void>}
     */
    public async publish(
        content: IQueuePayload<T>,
        options?: Partial<IProduceOptions>
    ): Promise<void> {
        return this._publishWithRetry(content, options || {});
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

export const getQueueProducerFactory = (options: {}) => {
    return <T>(queue: RabbitMqQueue<T>, options: IProducerConfig<T> = {}):
        RabbitMqProducer<T> => new RabbitMqProducer<T>(queue, options);
}
