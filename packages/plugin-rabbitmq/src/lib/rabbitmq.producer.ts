import { EventEmitter } from "events";
import retry from 'async-retry';
import type { Options } from 'amqplib';

import { CustomProps, DefaultConfig, Priority, ProducerEvents } from '../constants';
import type { IProduceHeaders, IProducerConfig, IQueueContext, IQueuePayload } from '../types';
import type { RabbitMqQueue } from './rabbitmq.queue';
import type { BaseContext } from 'nstarter-core';

/**
 * 生产事件
 */
export declare interface RabbitMqProducer<T, C extends BaseContext> {
    on: (event: ProducerEvents.publish, listener: (content: IQueuePayload<T>, context?: IQueueContext<C>) => void) => this;
}

/**
 * 队列生产者
 *
 * @property _queue - 队列
 * @property _options - 配置属性
 * @property _options.pushRetryTimes - 消息 publish 失败后重试次数
 * @property _options.expiration - 消息投递超时时长，超过时间未被消费，会被删除
 * @property _options.priority - 消息投递优先级
 */
export class RabbitMqProducer<T, C extends BaseContext = BaseContext> extends EventEmitter {
    protected readonly _options: IProducerConfig;
    protected readonly _queue: RabbitMqQueue<T>;

    constructor(queue: RabbitMqQueue<T>, options: IProducerConfig) {
        super();
        this._queue = queue;
        this._options = {
            pushRetryDelay: DefaultConfig.pushRetryDelay,
            ...options,
            // 总共重试 1~n 次
            pushRetryTimes: Math.max(options.pushRetryTimes ?? DefaultConfig.pushRetryTimes, 1) - 1,
        };
    }

    /**
     * 获取队列实例
     */
    public get queue(): RabbitMqQueue<T> {
        return this._queue;
    }

    /**
     * 格式化消息生产配置
     * @param {IProducerConfig} options - 配置参数
     * @return {Options.Publish}
     * @private
     */
    protected _getProduceOptions(options: IProducerConfig): Options.Publish {
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
        // 记录发起时间
        headers[CustomProps.publishTime] = Date.now();
        return {
            ...publishOpts,
            headers
        };
    }

    /**
     * 发送队列消息
     * @param content - 内容
     * @param context - 上下文
     */
    public async publish(content: IQueuePayload<T>, context?: IQueueContext<C>): Promise<void> {
        const o = this._options;
        return retry(async () => {
            this.emit(ProducerEvents.publish, content, context);
            await this._queue.publish(content, context, this._getProduceOptions({}));
        }, {
            retries: o.pushRetryTimes,
            minTimeout: o.pushRetryDelay,
            randomize: false
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
export const queueProducerFactory = <T>(queue: RabbitMqQueue<T>, options: IProducerConfig = {}):
    RabbitMqProducer<T> => new RabbitMqProducer<T>(queue, options);
