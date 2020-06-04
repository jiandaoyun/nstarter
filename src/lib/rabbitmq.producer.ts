import retry from 'async-retry';
import { Options } from 'amqplib';

import { CustomProps, DefaultConfig, Priority, RabbitProps } from '../constants';
import { IProduceHeaders, IProducerConfig, IQueuePayload } from '../types';
import { RabbitMqQueue } from './rabbitmq.queue';

export interface IQueueProducer<T> {
    publish(content: IQueuePayload<T>, options?: IProducerConfig<T>): Promise<void>;
    setup(): Promise<void>;
}

/**
 * 队列生产者
 *
 * @property _queue - 队列
 * @property _options - 配置属性
 * @property _options.pushRetryTimes - 消息 publish 失败后重试次数
 * @property _options.pushDelay - 延时 publish 时间，单位：MS
 * @property _options.expiration - 消息投递超时时长，超过时间未被消费，会被删除
 * @property _options.priority - 消息投递优先级
 */
class RabbitMqProducer<T> implements IQueueProducer<T> {
    protected readonly _options: IProducerConfig<T>;
    protected readonly _queue: RabbitMqQueue<T>;

    constructor(queue: RabbitMqQueue<T>, options: IProducerConfig<T>) {
        this._queue = queue;
        this._options = {
            pushRetryTimes: 0,
            pushRetryDelay: DefaultConfig.pushRetryDelay,
            pushDelay: 0,
            ...options
        };
    }

    /**
     * 格式化消息生产配置
     * @param {IProducerConfig<T>} options - 配置参数
     * @return {Options.Publish}
     * @private
     */
    protected _getProduceOptions(options: IProducerConfig<T>): Options.Publish {
        const o = this._options;
        const publishOpts: Options.Publish = {
            mandatory: true,
            persistent: true,
            deliveryMode: true,
            priority: Priority.Normal,
            ...o,
            ...options
        };
        // 自定义 headers 扩展
        const headers: IProduceHeaders = {
            ...o.headers,
            ...options.headers
        };
        // 延迟推送策略
        const pushDelay = options.pushDelay || o.pushDelay;
        if (pushDelay) {
            headers[RabbitProps.messageDelay] = pushDelay;
        }
        // 记录发起时间
        if (!headers[CustomProps.publishTime]) {
            headers[CustomProps.publishTime] = Date.now();
        }
        return {
            ...publishOpts,
            headers
        };
    }

    /**
     * 发送队列消息
     * @param {IQueuePayload<T>} content - 内容
     * @param {IProducerConfig<T>>} options -
     * @return {Promise<void>}
     */
    public async publish(content: IQueuePayload<T>, options?: IProducerConfig<T>): Promise<void> {
        const o = this._options;
        const publishOpts = this._getProduceOptions(options || {});
        return retry(async () => {
            await this._queue.publish(content, publishOpts);
            this._notifyPublish(content);
        }, {
            retries: o.pushRetryTimes,
            minTimeout: o.pushRetryDelay,
            randomize: false
        });
    }

    /**
     * 通知发布成功
     * @param content
     * @private
     */
    public _notifyPublish(content: IQueuePayload<T>): void {
        if (this._options.onPublish) {
            try {
                this._options.onPublish.apply(this, [content, this._queue]);
            } catch (err) {
                // 记录执行异常，但不阻塞队列任务正常调度
                console.warn('Rabbitmq job publish notify failed.');
            }
        }
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
