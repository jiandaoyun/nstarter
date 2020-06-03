import _ from 'lodash';
import { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage, Options } from 'amqplib';
import AssertExchange = Options.AssertExchange;
import AssertQueue = Options.AssertQueue;
import Publish = Options.Publish;
import Consume = Options.Consume;
import { DefaultConfig, DefaultExchangeOptions, DefaultQueueOptions, ExchangeType } from '../constants';
import { IMessageHandler, IQueuePayload, IQueueMessage } from '../types';

export interface IQueueConfig {
    // 队列配置
    queue: {
        name: string,
        routingKey: string,
        options?: AssertQueue
    };
    // 交换器配置
    exchange: {
        name: string,
        type: ExchangeType,
        options?: AssertExchange
    };
    prefetch?: number;
}

/**
 * RabbitMQ 队列
 * @class
 */
export class RabbitMqQueue<T> {
    protected _options: IQueueConfig;

    protected queue: string;
    protected exchange: string;
    protected _rabbitMq: AmqpConnectionManager;
    protected _channelWrapper: ChannelWrapper;
    protected _consumerTag: string;

    constructor(rabbitMq: AmqpConnectionManager, options: IQueueConfig) {
        this._options = _.defaultsDeep(options, {
            queue: {
                options: DefaultQueueOptions
            },
            exchange: {
                options: DefaultExchangeOptions
            },
            prefetch: DefaultConfig.prefetch
        });
        this._rabbitMq = rabbitMq;
        this._initChannelWrapper();
    }

    /**
     * 初始化
     * @private
     */
    private _initChannelWrapper(): void {
        const o = this._options;
        this._channelWrapper = this._rabbitMq.createChannel({
            json: false,
            // 启动、重连加载逻辑
            // 注册到 rabbitMQ 内部的 setups 队列中，启动或重连时调用
            setup: async (channel: ConfirmChannel): Promise<any> => {
                const { queue } = await channel.assertQueue(o.queue.name, o.queue.options);
                this.queue = queue;
                if (o.prefetch) {
                    await channel.prefetch(o.prefetch);
                }
                const { exchange } = await channel.assertExchange(
                    o.exchange.name, o.exchange.type, o.exchange.options
                );
                this.exchange = exchange;
                await channel.bindQueue(queue, exchange, o.queue.routingKey);
            }
        });
    }

    /**
     * 序列化 RabbitMQ 消息
     * @public
     */
    protected async _serializePayload<T>(content: T): Promise<Buffer> {
        return Buffer.from(JSON.stringify(content));
    }

    /**
     * 反序列化 RabbitMQ 消息
     * @public
     */
    protected async _deserializePayload<T>(content: Buffer): Promise<IQueuePayload<T>> {
        let result: IQueuePayload<T>;
        try {
            result = JSON.parse(_.toString(Buffer.from(content)));
        } catch (e) {
            result = {} as any;
        }
        return result;
    }

    /**
     * 订阅队列消息, PUSH 模式
     */
    public async subscribe(
        messageHandler: IMessageHandler<T>,
        options: Consume
    ): Promise<void> {
        await this.waitForSetup();
        return this._channelWrapper
            .addSetup(async(channel: ConfirmChannel) => {
                const { consumerTag } = await channel.consume(
                    this.queue,
                    async (message: ConsumeMessage | null) => {
                        if (!message) {
                            return;
                        }
                        const payload: IQueueMessage<T> = {
                            ...message,
                            content: await this._deserializePayload(message.content)
                        };
                        process.nextTick(() => messageHandler(payload));
                    },
                    options
                );
                this._consumerTag = consumerTag;
            });
    }

    /**
     * 队列任务创建方法
     * @param content
     * @param options
     */
    public async publish(content: IQueuePayload<T>, options: Publish) {
        const o = this._options;
        const payload = await this._serializePayload(content);
        return this._channelWrapper.publish(this.exchange, o.queue.routingKey, payload, options);
    }

    public ack(
        message: IQueueMessage<T>,
        allUpTo?: boolean
    ): void {
        this._channelWrapper.ack(message as any, allUpTo);

        let duration;
        if (message.runAt) {
            duration = Date.now() - message.runAt.getTime();
        }
        // TODO log
    }

    /**
     * 等待队列初始化完成
     * @return {Promise<void>}
     */
    public async waitForSetup(): Promise<void> {
        return this._channelWrapper.waitForConnect();
    }

    /**
     * 关闭链接
     * @return {Promise<void>}
     */
    public async close(): Promise<void> {
        return this._channelWrapper.close();
    }
}

/**
 * 队列配置定义的工厂方法
 */
export const queueFactory = <T>(rabbitMq: AmqpConnectionManager, options: IQueueConfig) =>
    new RabbitMqQueue<T>(rabbitMq, options);
