# RabbitMQ 队列

TODO

## 使用
### AMQP 链接
```typescript
import AmqpConnectManager from 'amqp-connection-manager';
const amqp = AmqpConnectManager.connect('amqp://user:password@127.0.0.1:5672/%2F', {
    heartbeatIntervalInSeconds: 60,
    reconnectTimeInSeconds: 1
});
```
### 队列启动
```typescript
import { ExchangeType, IQueueConfig, queueFactory, IRabbitMqMessage } from 'nstarter-rabbitmq';

export interface IDemoMessage extends IRabbitMqMessage {
    value: string;
}

// 队列配置
const queueConfig: IQueueConfig = {
    queue: {
        name: 'queue:demo:normal',
        routingKey: '',
        options: {
            exclusive: false,
            durable: false,
            autoDelete: true
        }
    },
    exchange: {
        name: 'exchange:demo:normal',
        type: ExchangeType.fanout,
        options: {
            durable: false,
            internal: false,
            autoDelete: true,
            alternateExchange: 'demo.alternate_exchange'
        }
    },
    prefetch: 2
};

export const demo_queue = queueFactory<IDemoMessage>(amqp, queueConfig);
```
### 生产者，向队列发消息
```typescript
import { IProduceOptions, queueProducerFactory } from 'nstarter-rabbitmq';
import { demo_queue, IDemoMessage } from './queue';

/**
 * 增量同步延迟队列 生产者
 */
const produceOption: Partial<IProduceOptions> = {
    // 设置延时等级
    pushDelay: DelayLevel.level6 // 10s
};

export const producer = queueProducerFactory<IDemoMessage>(demo_queue, produceOption);

// 启动生产者
producer.setup().then();
// 发送消息
producer
    .publish({ value: 'demo:normal' }, { mandatory: true, deliveryMode: true, persistent: true })
    .then(_.noop)
    .catch((err: Error) => console.log(err));
```

### 消费者，向队列订阅消息
```typescript
import { AckPolicy, IProduceOptions, queueConsumerFactory, RetryMethod, IConsumerConfig, startQueueConsumers } from 'nstarter-rabbitmq';
import { queue, IDemoMessage } from'./queue';
import { producer } from './producer';

const consumerConfig: IConsumerConfig<IDemoMessage> = {
    retryMethod: RetryMethod.republish,
    ackPolicy: AckPolicy.after,
    consumeTimeout: 10000, // 10s
    run(message): Promise<void> {
        const demoMessage: IDemoMessage = message.content;
        console.log(demoMessage);            
    },
    republish(content: IDemoMessage, options?: Partial<IProduceOptions>): Promise<void> {
        return producer.publish(content, options);
    }
};

export const consumer = queueConsumerFactory<IDemoMessage>(queue, consumerConfig);

// 注册队列消费者
consumer.register();
// 启动队列消费者
startQueueConsumers().then();
```

### RabbitMqQueue
| 参数名 | 类型 | 参数说明 |
| :-- | :-- | :-- |
| amqp | AmqpConnectManager | RabbitMQ 链接管理 |
| queue | IQueueConfig | 队列配置 |

#### RabbitMqQueue#waitForSetup(): Promise<void>
等待链接初始化完成。

#### RabbitMqQueue#close(): Promise<void>
关闭链接。

#### RabbitMqQueue#subscribe(messageHandler: IMessageHandler<T>, options: Consume): Promise<void>
Push 模式，客户端订阅队列消息，消息由服务端“推送”给客户端。

| 参数名 | 类型 | 参数说明 |
| :-- | :-- | :-- |
| messageHandler | IMessageHandler<T> | 消息处理逻辑 |
| options | object | 参数配置 |
| options.noAck | boolean | 是否不需要手动 ACK |
| options.exclusive | boolean | 是否启用匿名队列订阅，服务端分配一个匿名队列，断开链接后自动删除 |

#### RabbitMqQueue#publish(content: IQueuePayload<T>, options: Publish): Promise<void>
Confirm 模式，将消息内容发送到 RabbitMQ 中的 Exchange，确保消息准确被添加到队列，且持久化保存后返回。消息分发规则由 ```routingKey``` 和 ```exchange```规则确定。

| 参数名 | 类型 | 参数说明 |
| :-- | :-- | :-- |
| content | any | 消息内容 |
| options | IProduceOptions | 消息参数 |
| options.mandatory | boolean | 消息无法被正确“投递”时，服务端处理逻辑。```true``` 返回报错，```false```丢弃消息 |
| options.persistent | boolean | 是否消息持久化存储，同```deliveryMode``` |
| options.deliveryMode | boolean | 是否消息持久化存储，同```persistent``` |
| options.headers | IProduceHeaders | 消息生产者 headers |
| options.priority | Priority | 消息优先级，高优先级先分发消费 |
| options.expiration | number | 消息 TTL 时长，覆盖全局 ```deliverTimeout``` |
| options.pushRetryTimes | number | 覆盖全局```pushRetryTimes``` |
| options.pushDelay | DelayLevel | 覆盖全局```pushDelay``` |
| options.retryTimes | number | 覆盖全局```retryTimes``` |
| options.retryDelay | Delay | 覆盖全局```retryDelay``` |

#### RabbitMqQueue#ack(message: IQueueMessage<T>, allUpTo?: boolean): Promise<void>
确认消息消费，RabbitMQ 会将对应的消息删除。```allUpTo```为```true```，会将该消息之前的所有消息均 ack 掉。

#### RabbitMqQueue#nack(message: IQueueMessage<T>, allUpTo?: boolean, requeue?: boolean): Promise<void>
RabbitMQ 会“拿回”该消息的。```requeue```为```true```会重新将该消息放回队列，否则丢弃该消息。

### RabbitMqProducer
| 参数名 | 类型 | 参数说明 |
| :-- | :-- | :-- |
| queue | RabbitMqQueue<T> | 队列对象 |
| options | Partial<IProduceOptions> | 消息参数 |
| options.mandatory | boolean | 消息无法被正确“投递”时，服务端处理逻辑。```true``` 返回报错，```false```丢弃消息 |
| options.persistent | boolean | 是否消息持久化存储，同```deliveryMode``` |
| options.deliveryMode | boolean | 是否消息持久化存储，同```persistent``` |
| options.headers | IProduceHeaders | 消息生产者 headers |
| options.priority | Priority | 消息优先级，高优先级先分发消费 |
| options.expiration | number | 消息 TTL 时长，覆盖全局 ```deliverTimeout``` |
| options.pushRetryTimes | number | 消息发送时，本地重试次数 |
| options.pushDelay | DelayLevel | 消息发送时，本地重试延时 |
| options.retryTimes | number | 消息重试次数 |
| options.retryDelay | DelayLevel | 消息重试延时 |

#### RabbitMqProducer#setup(): Promise<void>
队列生产者启动方法。

#### RabbitMqProducer#publish(content: IQueuePayload<T>, options: Publish): Promise<void>
此方法带本地重试机制。参数内容同 ```RabbitMqQueue#publish(content, options)```。

### RabbitMqConsumer
| 参数名 | 类型 | 参数说明 |
| :-- | :-- | :-- |
| queue | RabbitMqQueue<T> | 队列对象 |
| options | IConsumerConfig<T> | 消费者参数 |
| options.retryTimes | number | 重试次数 |
| options.retryDelay | DelayLevel | 重试延时等级 |
| options.retryMethod | RetryMethod | 重试策略，RetryMethod.retry 本地重试，RetryMethod.republish 重新发布到队列 |
| options.ackPolicy | AckPolicy | 消息 ACK 策略，AckPolicy.before 执行前，AckPolicy.after 执行后 |
| options.consumeTimeout | number | 消息消费超时时间，从消息生产开始算，republish 会刷新时间 |
| options.run | (message: IQueueMessage<T>): Promise<void>; | 消息消费逻辑 |
| options.retry | (err: Error, message: IQueueMessage<T>, count: number): Promise<void>; | 消息本地重试逻辑 |
| options.republish | (content: IQueuePayload<T>, options?: Partial<IProduceOptions>): Promise<void>; | 消息重新发布逻辑 |
| options.error | (err: Error, message: IQueueMessage<T>): void; | 错误处理逻辑 |

#### RabbitMqConsumer#start(): Promise<void>
启动消费者, 执行任务订阅。

#### RabbitMqConsumer#stop(): Promise<void>
停止消费者执行。
