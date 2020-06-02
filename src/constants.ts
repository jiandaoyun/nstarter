/**
 * Exchange 类型
 */
export enum ExchangeType {
    topic = 'topic',
    headers = 'headers',
    fanout = 'fanout',
    direct = 'direct',
    delay = 'x-delayed-message'
}

/**
 * 默认任务优先级：[-100, 100]
 */
export enum Priority {
    Low = -50,
    Normal = 0,
    Medium = 50,
    High = 80,
    Critical = 100
}

/**
 * 消费者重试策略
 */
export enum RetryMethod {
    // 本地重试
    retry = 'retry',
    // 重新发布到队列
    republish = 'republish'
}

/**
 * RabbitMQ 内置参数、headers
 */
export enum RabbitProps {
    deadLetterExchange = 'x-dead-letter-exchange',           // 死信 Exchange 名称
    messageDelay = 'x-delay',                                // 队列消息动态延时，单位：MS
    delayDeliverType = 'x-delayed-type'                      // 延时消息 Exchange 分发规则
}

/**
 * 自定义消息 headers
 */
export enum CustomProps {
    publishTime = 'x-publish-time',                   // 消息生产时间戳
    retryTimes = 'x-retry-times',                     // 消费重试次数
}

/**
 * RabbitMQ 默认配置
 */
export const DefaultConfig = {
    // 单个 Channel 消息处理并发数
    prefetch: 10,
    // 默认重试次数，重试 2 次，总共执行 3 次
    retryTimes: 2,
    // 默认延时 1000ms
    retryDelay: 1000,
    // 消息发送重试延迟时间 (ms)
    pushRetryDelay: 1000
};

/**
 * 队列默认配置
 */
export const DefaultQueueOptions = {
    exclusive: false,
    durable: true,
    autoDelete: false
};

/**
 * Exchange 默认配置
 */
export const DefaultExchangeOptions = {
    durable: true,
    autoDelete: false,
    internal: false,
    alternateExchange: 'nstarter.default_aex'
};
