import { AmqpConnectionManager, ChannelWrapper, SetupFunc } from 'amqp-connection-manager';
import { ConfirmChannel, ConsumeMessage, Options } from 'amqplib';
import { DefaultConfig, ExchangeType, OverflowMethod, RabbitProps } from '../constants';
import { IMessageHandler, IQueueMessage, IQueuePayload } from '../types';
import AssertExchange = Options.AssertExchange;
import AssertQueue = Options.AssertQueue;
import Publish = Options.Publish;
import Consume = Options.Consume;

export interface IQueueConfig {
    name: string;
    prefetch?: number;
    maxLength?: number;
    overflowMethod?: OverflowMethod;
    isDelay?: boolean;
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
    protected _setupFunc: SetupFunc;

    constructor(rabbitMq: AmqpConnectionManager, options: IQueueConfig) {
        this._options = {
            prefetch: DefaultConfig.prefetch,
            maxLength: undefined,
            overflowMethod: OverflowMethod.reject_publish,
            isDelay: false,
            ...options
        }
        this._rabbitMq = rabbitMq;
        this._initChannelWrapper();
    }

    /**
     * 获取队列名称
     */
    public get name(): string {
        return this._options.name;
    }

    /**
     * 生成队列配置
     * @private
     */
    private _getQueueOptions(): AssertQueue {
        const options: AssertQueue = {
            durable: true,
            autoDelete: false,
            exclusive: false
        };
        // 队列溢出策略
        if (this._options.maxLength) {
            options.arguments = {
                [RabbitProps.maxMessageLength]: this._options.maxLength,
                [RabbitProps.overflowMethod]: this._options.overflowMethod,
            };
        }
        return options;
    }

    /**
     * 生成 exchange 配置
     * @private
     */
    private _getExchangeOptions(): AssertExchange {
        const options: AssertExchange = {
            durable: true,
            autoDelete: false,
            internal: false
        };
        // 延迟队列
        if (this._options.isDelay) {
            options.arguments = {
                [RabbitProps.delayDeliverType]: DefaultConfig.exchangeType
            };
        }
        return options;
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
                const { queue } = await channel.assertQueue(o.name, this._getQueueOptions());
                this.queue = queue;
                if (o.prefetch) {
                    await channel.prefetch(o.prefetch);
                }
                const exchangeType = o.isDelay ? ExchangeType.delay : DefaultConfig.exchangeType;
                const { exchange } = await channel.assertExchange(
                    o.name, exchangeType, this._getExchangeOptions()
                );
                this.exchange = exchange;
                await channel.bindQueue(queue, exchange, DefaultConfig.routingKey);
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
            result = JSON.parse(Buffer.from(content).toString());
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
        this._setupFunc = async (channel: ConfirmChannel) => {
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
        };
        return this._channelWrapper.addSetup(this._setupFunc);
    }

    /**
     * 取消任务订阅
     */
    public async unsubscribe(): Promise<void> {
        return this._channelWrapper.removeSetup(this._setupFunc, async (channel: ConfirmChannel) => {
            await channel.cancel(this._consumerTag);
        });
    }

    /**
     * 获取队列长度
     */
    public length() {
        return this._channelWrapper.queueLength();
    }

    /**
     * 队列任务创建方法
     * @param content
     * @param options
     */
    public async publish(content: IQueuePayload<T>, options: Publish) {
        const payload = await this._serializePayload(content);
        return this._channelWrapper.publish(this.exchange, DefaultConfig.routingKey, payload, options);
    }

    public ack(
        message: IQueueMessage<T>,
        allUpTo?: boolean
    ): void {
        this._channelWrapper.ack(message as any, allUpTo);
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
