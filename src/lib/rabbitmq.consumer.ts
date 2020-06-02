import _ from 'lodash';
import retry from 'async-retry';

import { CustomProps, DefaultConfig, RetryMethod } from '../constants';
import { IProduceHeaders, IProduceOptions, IQueueMessage, IQueuePayload } from '../types';
import { RabbitMqQueue } from './rabbitmq.queue';

const queueConsumerRegistry: IQueueConsumer<any>[] = [];

export interface IConsumerConfig<T> {
    retryTimes?: number;
    retryDelay?: number;
    retryMethod?: RetryMethod;
    consumeTimeout?: number;
    run(message: IQueueMessage<T>): Promise<void>;
    retry?(err: Error, message: IQueueMessage<T>, count: number): Promise<void>;
    republish?(content: IQueuePayload<T>, options?: Partial<IProduceOptions>): Promise<void>;
    error?(err: Error, message: IQueueMessage<T>): void;
    onFinish?(queue: RabbitMqQueue<T>, message: IQueueMessage<T>, duration: number): Promise<void>;
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
        message.runAt = new Date();
        return this._options.run.apply(this, arguments);
    }

    /**
     * 重新插入队列
     * @param content
     * @param options
     * @private
     */
    private async _republish(content: IQueuePayload<T>, options?: Partial<IProduceOptions>): Promise<void> {
        if (this._options.republish) {
            return this._options.republish.apply(this, arguments);
        }
    }

    /**
     * 异常处理调用入口
     * @param err
     * @param message
     * @private
     */
    private async _error(err: Error, message?: IQueueMessage<T>): Promise<void> {
        if (this._options.error) {
            return this._options.error.apply(this, arguments);
        }
    }

    /**
     * 启动消费者, 执行任务订阅
     */
    public async start(): Promise<void> {
        const o = this._options;
        await this._queue.subscribe(async (message: IQueueMessage<T>) => {
            try {
                if (o.retryMethod === RetryMethod.republish) {
                    // 队列重新发布重试
                    await this._handleWithRepublish(message);
                } else {
                    // 默认执行本地 retry
                    await this._handleWithRetry(message)
                }
            } catch (err) {
                await this._error(err, message);
            } finally {
                // 确保消费过程 message 被 ack
                this._queue.ack(message);
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
     * @param {IQueueMessage} message
     */
    protected async _handleWithRetry(
        message: IQueueMessage<T>
    ): Promise<void> {
        const o = this._options;
        try {
            return retry(async () => {
                await this._run(message);
            }, {
                retries: o.retryTimes || 0,
                minTimeout: o.retryDelay,
                randomize: false
            });
        } catch (err) {
            return this._error(err, message);
        }
    }

    /**
     * 失败重新分发任务至队列的策略
     * @param {IQueueMessage} message
     */
    protected async _handleWithRepublish(
        message: IQueueMessage<T>
    ): Promise<void> {
        const o = this._options;
        try {
            await this._run(message);
        } catch (err) {
            // 执行重试
            const headers = _.get(message.properties, 'headers', {}) as IProduceHeaders;
            const pushDelay = headers[CustomProps.retryDelay],
                triedTimes = headers[CustomProps.retryTimes] || 0,
                produceTime = headers[CustomProps.produceTimestamp];
            let timeoutTime;
            if (produceTime && o.consumeTimeout) {
                timeoutTime = produceTime + o.consumeTimeout;
            }
            if (
                // 无重试策略 或 超出重试次数限定
                (!o.retryTimes || triedTimes >= o.retryTimes)
                // 消费超时
                || (timeoutTime && timeoutTime < Date.now())
            ) {
                // 超出重试计数
                await this._error(err, message);
            } else {
                // 重新发布至队列
                try {
                    // 无需额外 retry 逻辑，publish 封装中本身具备 publish retry 策略
                    await this._republish(message.content, {
                        mandatory: true,
                        persistent: true,
                        deliveryMode: true,
                        headers: {
                            ...headers,
                            [CustomProps.produceTimestamp]: Date.now(),
                            [CustomProps.retryTimes]: triedTimes + 1
                        },
                        pushDelay
                    });
                } catch (err) {
                    await this._error(err, message);
                }
            }
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
