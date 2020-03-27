import _ from 'lodash';

import { CustomProps, DefaultConfig, RetryMethod } from '../constants';
import { DelayLevel, IProduceHeaders, IProduceOptions, IQueueMessage, IQueuePayload } from '../types';
import { RabbitMqQueue } from './rabbitmq.queue';
import { promisify } from 'util';
import async from 'async';

const queueConsumerRegistry: IQueueConsumer<any>[] = [];

export interface IConsumerConfig<T> {
    retryTimes?: number;
    retryDelay?: DelayLevel;
    retryMethod?: RetryMethod;
    run(message: IQueueMessage<T>): Promise<void>;
    retry?(err: Error, message: IQueueMessage<T>, count: number): Promise<void>;
    republish?(content: IQueuePayload<T>,options?: Partial<IProduceOptions>): Promise<void>;
    error?(err: Error): void;
}

export interface IQueueConsumer<T> {
    start(): Promise<void>;
    run(message: IQueueMessage<T>): Promise<void>;
    retry(err: Error, message: IQueueMessage<T>, count: number): Promise<void>;
    stop(): Promise<void>;
}

/**
 * 队列消费者
 */
class RabbitMqConsumer<T> implements IQueueConsumer<T> {
    protected readonly _options: IConsumerConfig<T>;
    protected readonly _queue: RabbitMqQueue<T>;

    constructor(queue: RabbitMqQueue<T>, config: IConsumerConfig<T>) {
        this._queue = queue;
        this._options = {
            retryTimes: DefaultConfig.RetryTimes,
            retryDelay: DefaultConfig.RetryDelay,
            retryMethod: RetryMethod.retry,
            ...config
        };
    }

    /**
     * 注册方法
     */
    public register(): RabbitMqConsumer<T> {
        queueConsumerRegistry.push(this);
        return this;
    }

    /**
     * 任务执行方法
     */
    public async run(message: IQueueMessage<T>): Promise<void> {
        return _.invoke(this._options, 'run', message);
    }

    /**
     * 重试方法
     * @param err
     * @param message
     */
    public async retry(err: Error | null, message: IQueueMessage<T>): Promise<void> {
        return _.invoke(this._options, 'retry', message);
    }

    /**
     * 启动消费者, 执行任务订阅
     */
    public async start(): Promise<void> {
        const o = this._options;
        await this._queue.subscribe(async (message: IQueueMessage<T>) => {
            try {
                await this.run(message);
            } catch (err) {
                if (o.retryMethod === RetryMethod.republish) {
                    return this._ackOrRepublish(err, message);
                } else {
                    // 默认执行本地 retry
                    return this._ackOrRetry(err, message)
                }
            }
            return this._queue.ack(message);
        }, { noAck: false })
    }

    /**
     * 停止消费者执行
     */
    public async stop(): Promise<void> {
        return this._queue.close();
    }


    /**
     * 本地重试执行
     * @param {Error} err
     * @param {IQueueMessage} message
     */
    protected async _ackOrRetry(
        err: Error | null,
        message: IQueueMessage<T>
    ): Promise<void> {
        const o = this._options;
        promisify<void>((callback) => {
            if (!o.retryTimes) {
                return callback(err);
            }
            async.retry(o.retryTimes, async () => {
                await this.retry(err, message);
            }, callback);
        })();
        return this._queue.ack(message);
    }

    /**
     * 调用消息生产者，重新添加到 rabbitMq 队列
     * @param {Error} err
     * @param {IQueueMessage} message
     */
    protected async _ackOrRepublish(
        err: Error | null,
        message: IQueueMessage<T>
    ): Promise<void> {
        const o = this._options;
        if (!err) {
            // 正确处理完成，ACK
            return this._queue.ack(message);
        }
        // 执行重试
        const headers = _.get(message.properties, 'headers', {}) as IProduceHeaders;
        const pushDelay = headers[CustomProps.consumeRetryDelay],
            triedTimes = headers[CustomProps.consumeRetryTimes] || 0;
        if (!o.retryTimes || triedTimes >= o.retryTimes || !_.isFunction(o.republish)) {
            // 不需要重试、重试机会使用完毕，队列 ACK 删除消息（防止无限重复消费）
            if (_.isFunction(o.error)) {
                o.error(err);
            }
            return this._queue.ack(message);
        }
        // 配置了 producer，调整重试参数，添加回队列，并删除原消息
        try {
            const publishHeaders: IProduceHeaders = _.defaults(
                {
                    [CustomProps.produceTimestamp]: Date.now(),
                    [CustomProps.consumeRetryTimes]: triedTimes + 1,
                },
                _.pick<IProduceHeaders>(headers, _.values(CustomProps))
            );
            const args = [message.content, {
                mandatory: true,
                persistent: true,
                deliveryMode: true,
                headers: publishHeaders,
                pushDelay
            }];
            _.invoke(o, 'republish', args);
        } catch (e) {
            return this._queue.nack(message);
        }
        // 重试成功
        return this._queue.ack(message);
    }
}

/**
 * 生成队列消费者的工厂方法
 * @param queue
 * @param options
 */
export const queueConsumerFactory = <T>(queue: RabbitMqQueue<T>, options: IConsumerConfig<T>):
    RabbitMqConsumer<T> => new RabbitMqConsumer<T>(queue, options);

/**
 * 队列消费者启动方法
 */
export const startQueueConsumers = async(): Promise<void> => {
    await Promise.all(_.map(queueConsumerRegistry,
        (consumer: IQueueConsumer<any>) => consumer.start()
    ));
    return;
};
