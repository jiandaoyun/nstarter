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
### 生产者，向队列发消息
```typescript
import { RabbitMQProducer, IExchangeConfig, IQueueConfig } from './src/lib';

const exchangeConfig: IExchangeConfig = {
    name: 'exchange:demo:normal',
    type: 'fanout',
    options: {
        durable: false,
        internal: false,
        autoDelete: true,
        alternateExchange: 'demo.alternate_exchange'
    }
};
const queueConfig: IQueueConfig = {
    name: 'queue:demo:normal',
    routingkey: 'demo:normal',
    exchange: exchangeConfig,
    options: {
        exclusive: false,
        durable: false,
        autoDelete: true
    }
};
const producer = new RabbitMQProducer<string>({ amqp, queueConfig });

producer
    .publish('demo:normal', { mandatory: true, deliveryMode: true, persistent: true })
    .then(_.noop)
    .catch((err: Error) => console.log(err));
```

### 消费者，向队列订阅消息
```typescript
import { RabbitMQConsumer, ISubscribeMessage } from './lib';

const consumer = new RabbitMQConsumer<string>({
    amqp,
    queueConfig,
    prefetch: 5
});
consumer
    .subscribe((message: ISubscribeMessage<string>) => {
        console.log(message.content);
        consumer.ackOrRetry(null, message, producer);
    }, { noAck: false })
    .then(_.noop)
    .catch((err: Error) => console.log(err));
```

### RabbitMQProducer
| 参数名 | 类型 | 参数说明 |
| :-- | :-- | :-- |
| pushRetryTimes | number | 向 RabbitMQ 发送消息失败重试次数 |
| pushDelay | DelayLevel | 向 RabbitMQ 发送消息延时“投递”到目标队列时间，单位：毫秒ms |
| deliverTimeout | number | 消息 TTL 时长，被投递到队列后指定时间内未被消费，则消息被删除 |
| retryTimes | number | 消息消费失败的重试次数 |
| retryDelay | Delay | 消息消费失败重试（重新入队列）前的延时时长，单位：毫秒ms |

#### RabbitMQProducer#publish(content, options)
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


#### RabbitMQProducer#sendToQueue(content, options)
Confirm 模式，将消息内容**直接**发送到申明中的队列，确保消息准确被添加到队列，且持久化保存后返回。

参数内容同 ```RabbitMQProducer#publish(content, options)```。

### RabbitMQConsumer
| 参数名 | 类型 | 参数说明 |
| :-- | :-- | :-- |
| amqp | AmqpConnectionManager | AMQP 链接 |
| prefetch | number | 单个消费者处理消息的并发度 |
| retryTimes | number | 消息消费失败的重试次数 |
| retryDelay | Delay | 消息消费失败重试（重新入队列）前的延时时长，单位：毫秒ms |

#### RabbitMQConsumer#fetch(options)
Pull 模式，主动去队列里“拉取”一条消息。

| 参数名 | 类型 | 参数说明 |
| :-- | :-- | :-- |
| options | object | 参数配置 |
| options.noAck | boolean | 是否不需要手动 ACK |

#### RabbitMQConsumer#subscribe(messageHandler, options)
Push 模式，客户端订阅队列消息，消息由服务端“推送”给客户端。

| 参数名 | 类型 | 参数说明 |
| :-- | :-- | :-- |
| messageHandler | IMessageHandler<T> | 消息处理逻辑 |
| options | object | 参数配置 |
| options.noAck | boolean | 是否不需要手动 ACK |
| options.exclusive | boolean | 是否启用匿名队列订阅，服务端分配一个匿名队列，断开链接后自动删除 |

#### RabbitMQConsumer#unsubscribe()
取消队列订阅

#### RabbitMQConsumer#ack(message, allUpTo)
确认消息消费，RabbitMQ 会将对应的消息删除。```allUpTo```为```true```，会将该消息之前的所有消息均 ack 掉。

#### RabbitMQConsumer#nack(message, allUpTo, requeue)
RabbitMQ 会“拿回”该消息的。```requeue```为```true```会重新将该消息放回队列，否则丢弃该消息。


#### RabbitMQConsumer#ackOrRetry(err, message, producer)
如果没有错误，则确认正确消费该消息，否则根据配置入队重试。

| 参数名 | 类型 | 参数说明 |
| :-- | :-- | :-- |
| err | Error,null | 错误信息 |
| message | any | 队列消息 |
| producer | RabbitMQProducer | 对应的消息生产者 |

