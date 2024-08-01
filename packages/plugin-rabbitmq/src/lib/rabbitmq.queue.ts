import { BaseContext, ContextProvider } from 'nstarter-core';
import { AmqpConnectionManager, ChannelWrapper, Options, SetupFunc, Channel } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { DefaultConfig, OverflowMethod, RabbitProps } from '../constants';
import { IMessageHandler, IQueueContext, IQueueMessage, IQueuePayload, IWrappedPayload } from '../types';


export interface IQueueConfig {
    name: string;
    prefetch: number;
    maxLength: number;
    overflowMethod?: OverflowMethod;
}

/**
 * RabbitMQ 队列
 * @class
 */
export class RabbitMqQueue<T, C extends BaseContext = BaseContext> {
    protected _options: IQueueConfig;

    protected queue: string;
    protected exchange: string;
    protected _rabbitMq: AmqpConnectionManager;
    protected _channelWrapper: ChannelWrapper;
    protected _consumerTag: string;
    protected _setupFunc: SetupFunc;

    constructor(rabbitMq: AmqpConnectionManager, options: IQueueConfig) {
        this._options = {
            overflowMethod: OverflowMethod.reject_publish,
            ...options
        };
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
    private _getQueueOptions(): Options.AssertQueue {
        const options: Options.AssertQueue = {
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
    private _getExchangeOptions(): Options.AssertExchange {
        return {
            durable: true,
            autoDelete: false,
            internal: false
        };
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
            setup: async (channel: Channel): Promise<any> => {
                const { queue } = await channel.assertQueue(o.name, this._getQueueOptions());
                this.queue = queue;
                if (o.prefetch) {
                    await channel.prefetch(o.prefetch);
                }
                const { exchange } = await channel.assertExchange(
                    o.name, DefaultConfig.exchangeType, this._getExchangeOptions()
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
    protected _serializePayload(content: IQueuePayload<T>, context?: IQueueContext<C>): Buffer {
        let payload: IWrappedPayload<T, C> | IQueuePayload<T> = content;
        // 在需要 context 的场景下，对 payload 进行包装处理
        if (context) {
            payload = {
                wrapped: true,
                _content: payload,
                _context: context.toJSON(),
            };
        }
        return Buffer.from(JSON.stringify(payload));
    }

    /**
     * 反序列化 RabbitMQ 消息
     * @public
     */
    protected _deserializePayload(content: Buffer): IWrappedPayload<T, C> | IQueuePayload<T> {
        let result: IWrappedPayload<T, C> | IQueuePayload<T>;
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
        options: Options.Consume
    ): Promise<void> {
        await this.waitForSetup();
        const o = this._options;
        this._setupFunc = async (channel: Channel) => {
            if (o.prefetch) {
                // 防止 channel 关闭重建时，创建没有 prefetch 限制的 consumer
                await channel.prefetch(o.prefetch);
            }
            const { consumerTag } = await channel.consume(
                this.queue,
                (message: ConsumeMessage | null) => {
                    if (!message) {
                        return;
                    }
                    let payload: IQueueMessage<T>;
                    const deserialized = this._deserializePayload(message.content);
                    if ((deserialized as IWrappedPayload<T, C>)?.wrapped) {
                        // 存在上下文的包装消息处理
                        const wrappedPayload = deserialized as IWrappedPayload<T, C>;
                        payload = {
                            ...message,
                            content: wrappedPayload._content,
                        };
                        // 注入上下文
                        ContextProvider.startContext(wrappedPayload._context);
                    } else {
                        // 未包装队列消息传递
                        payload = {
                            ...message,
                            content: deserialized as IQueuePayload<T>
                        };
                        if (ContextProvider.hasInitialized()) {
                            // 如果已经初始化过上下文环境，注入上下文
                            ContextProvider.startContext();
                        }
                    }
                    process.nextTick(() => messageHandler(channel, payload));
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
        return this._channelWrapper.removeSetup(this._setupFunc, async (channel: Channel) => {
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
     * @param content - 队列消息内容
     * @param context - 队列任务上下文
     * @param options - 任务发布参数
     */
    public async publish(content: IQueuePayload<T>, context: IQueueContext<C> | undefined, options: Options.Publish) {
        const payload = this._serializePayload(content, context);
        return this._channelWrapper.publish(this.exchange, DefaultConfig.routingKey, payload, options);
    }

    /**
     * 等待队列初始化完成
     */
    public async waitForSetup(): Promise<void> {
        return this._channelWrapper.waitForConnect();
    }

    /**
     * 关闭链接
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
