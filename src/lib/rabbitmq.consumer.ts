import { EventEmitter } from 'events';
import retry from 'async-retry';
import { Options } from 'amqplib';

import { ConsumerEvents, CustomProps, DefaultConfig, defaultStopTimeout, RabbitProps, RetryMethod } from '../constants';
import { IConsumerConfig, IQueueMessage, IQueuePayload } from '../types';
import { RabbitMqQueue } from './rabbitmq.queue';
import { sleep } from '../utils';

const queueConsumerRegistry: RabbitMqConsumer<any>[] = [];

/**
 * 消费事件
 */
export declare interface RabbitMqConsumer<T> {
    /**
     * 任务开始执行
     */
    on(event: ConsumerEvents.run, listener: (message: IQueueMessage<T>) => void): this;

    /**
     * 任务重试 (retry 或 republish 取决于具体重试策略)
     */
    on(event: ConsumerEvents.retry, listener: (err: Error, message: IQueueMessage<T>, attempt: number) => void): this;

    /**
     * 任务执行错误
     */
    on(event: ConsumerEvents.error, listener: (err: Error, message: IQueueMessage<T>) => void): this;

    /**
     * 任务执行完成
     */
    on(event: ConsumerEvents.finish, listener: (message: IQueueMessage<T>) => void): this;
}

/**
 * 队列消费者
 */
export class RabbitMqConsumer<T> extends EventEmitter {
    protected readonly _options: IConsumerConfig<T>;
    protected readonly _queue: RabbitMqQueue<T>;

    constructor(queue: RabbitMqQueue<T>, config: IConsumerConfig<T>) {
        super();
        this._queue = queue;
        this._options = {
            timeout: 0,
            retryTimes: DefaultConfig.retryTimes,
            retryDelay: DefaultConfig.retryDelay,
            retryMethod: RetryMethod.retry,
            ...config
        };
    }

    /**
     * 获取队列实例
     */
    public get queue(): RabbitMqQueue<T> {
        return this._queue;
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
        const startTime = Date.now();
        this.emit(ConsumerEvents.run, message);
        const result = await this._options.run.apply(this, arguments);
        message.duration = Date.now() - startTime;
        this._notifyFinish(message);
        return result;
    }

    /**
     * 任务执行完成反馈
     * @param message
     * @private
     */
    private _notifyFinish(message: IQueueMessage<T>): void {
        this.emit(ConsumerEvents.finish, message, this._queue);
    }

    /**
     * 重新插入队列
     * @param content
     * @param options
     * @private
     */
    private async _republish(content: IQueuePayload<T>, options: Options.Publish): Promise<void> {
        await this._queue.publish(content, options);
    }

    /**
     * 异常处理调用入口
     * @param err
     * @param message
     * @private
     */
    private _error(err: Error, message?: IQueueMessage<T>): void {
        this.emit(ConsumerEvents.error, ...arguments);
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
            // 采用手动 ack 策略，自动 ack 会将队列消息直接分发
        }, { noAck: false });
    }

    /**
     * 停止消费者执行
     */
    public async stop(timeoutMs = defaultStopTimeout): Promise<void> {
        await this._queue.unsubscribe();
        const waitStart = Date.now();
        // 队列中存在未消费完任务 且 等待未超时
        while (this._queue.length() > 0 && Date.now() - waitStart < timeoutMs) {
            await sleep(1000);
        }
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
        return retry(async (err, attempt) => {
            if (attempt > 0) {
                this.emit(ConsumerEvents.retry, err, message, attempt);
            }
            await this._run(message);
        }, {
            retries: o.retryTimes,
            minTimeout: o.retryDelay,
            randomize: false
        });
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
            const headers = message.properties?.headers || {};
            const pushDelay = o.retryDelay,
                triedTimes = headers[CustomProps.retryTimes] || 0;
            const publishTime = headers[CustomProps.publishTime];
            let timeoutTime;
            if (publishTime && o.timeout) {
                timeoutTime = publishTime + o.timeout;
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
                    const retryTimes = triedTimes + 1;
                    headers[CustomProps.retryTimes] = retryTimes;
                    if (pushDelay) {
                        headers[RabbitProps.messageDelay] = pushDelay;
                    }
                    this.emit(ConsumerEvents.retry, err, message, retryTimes);
                    await this._republish(message.content, {
                        mandatory: true,
                        persistent: true,
                        deliveryMode: true,
                        headers
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
    await Promise.all(
        queueConsumerRegistry.map((consumer: RabbitMqConsumer<any>) => consumer.start())
    );
    return;
};
