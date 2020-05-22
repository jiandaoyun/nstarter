import async from 'async';
import _ from 'lodash';
import moment from 'moment';
import { promisify } from 'util';

import { AckPolicy, CustomProps, DefaultConfig, RetryMethod } from '../constants';
import { DelayLevel, IProduceHeaders, IProduceOptions, IQueueMessage, IQueuePayload } from '../types';
import { RabbitMqQueue } from './rabbitmq.queue';

const queueConsumerRegistry: IQueueConsumer<any>[] = [];

export interface IConsumerConfig<T> {
    retryTimes?: number;
    retryDelay?: DelayLevel;
    retryMethod?: RetryMethod;
    ackPolicy?: AckPolicy;
    consumeTimeout?: number;
    run(message: IQueueMessage<T>): Promise<void>;
    retry?(err: Error, message: IQueueMessage<T>, count: number): Promise<void>;
    republish?(content: IQueuePayload<T>, options?: Partial<IProduceOptions>): Promise<void>;
    error?(err: Error, message: IQueueMessage<T>): void;
}

export interface IQueueConsumer<T> {
    start(): Promise<void>;
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
            consumeTimeout: 0,
            retryTimes: DefaultConfig.RetryTimes,
            retryDelay: DefaultConfig.RetryDelay,
            retryMethod: RetryMethod.retry,
            ackPolicy: AckPolicy.after,
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
    private async _run(message: IQueueMessage<T>): Promise<void> {
        return _.invoke(this._options, 'run', message);
    }

    /**
     * 重试方法
     * @param err
     * @param message
     */
    private async _retry(err: Error | null, message: IQueueMessage<T>): Promise<void> {
        return _.invoke(this._options, 'retry', err, message);
    }

    /**
     * 重新插入队列
     * @param content
     * @param options
     * @private
     */
    private async _republish(content: IQueuePayload<T>, options?: Partial<IProduceOptions>): Promise<void> {
        return _.invoke(this._options, 'republish', content, options);
    }

    /**
     * 异常处理调用入口
     * @param err
     * @param message
     * @private
     */
    private async _error(err: Error, message?: IQueueMessage<T>): Promise<void> {
        return _.invoke(this._options, 'error', err, message);
    }

    /**
     * 启动消费者, 执行任务订阅
     */
    public async start(): Promise<void> {
        const o = this._options;
        await this._queue.subscribe(async (message: IQueueMessage<T>) => {
            try {
                if (o.ackPolicy === AckPolicy.before) {
                    // 执行前 ack
                    this._queue.ack(message);
                }
                await this._run(message);
            } catch (err) {
                if (o.retryMethod === RetryMethod.republish) {
                    return this._ackOrRepublish(err, message);
                } else {
                    // 默认执行本地 retry
                    return this._ackOrRetry(err, message)
                }
            } finally {
                if (o.ackPolicy !== AckPolicy.before) {
                    // 确保消费过程 message 被 ack
                    this._queue.ack(message);
                }
            }
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
                await this._retry(err, message);
            }, callback);
        })();
        return;
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
            return;
        }
        // 执行重试
        const headers = _.get(message.properties, 'headers', {}) as IProduceHeaders;
        const pushDelay = headers[CustomProps.consumeRetryDelay],
            triedTimes = headers[CustomProps.consumeRetryTimes] || 0,
            produceTimestamp = headers[CustomProps.produceTimestamp],
            timeoutStamp = moment(produceTimestamp).add(o.consumeTimeout, 'ms');
        if (
            (!o.retryTimes || triedTimes >= o.retryTimes)   // 不需要重试、重试机会使用完毕，队列 ACK 删除消息（防止无限重复消费）
            || (o.consumeTimeout && produceTimestamp && timeoutStamp.isBefore(Date.now()))  // 消息超时
        ) {

            this._error(err, message);
            return;
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
            this._republish(message.content, {
                mandatory: true,
                persistent: true,
                deliveryMode: true,
                headers: publishHeaders,
                pushDelay
            });
        } catch (err) {
            this._error(err, message);
        }
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
