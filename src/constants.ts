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
 * 队列超出长度后的处理策略
 * @enum OverflowMethod
 */
export enum OverflowMethod {
    reject_publish = 'reject-publish',  // 拒绝新任务入队
    drop_head = 'drop-head'             // 删除队首尚未分发的任务(如果指定了死信队列会分发至对应 Exchange)
}

/**
 * RabbitMQ 内置参数、headers
 */
export enum RabbitProps {
    deadLetterExchange = 'x-dead-letter-exchange',           // 死信 Exchange 名称
    messageDelay = 'x-delay',                                // 队列消息动态延时，单位：MS
    delayDeliverType = 'x-delayed-type',                     // 延时消息 Exchange 分发规则
    maxMessageLength = 'x-max-length',                       // 队列消息最大长度, 超过后会被移到死信队列中
    overflowMethod = 'x-overflow'                            // 队列超出长度限制后的行为
}

/**
 * 自定义消息 headers
 */
export enum CustomProps {
    publishTime = 'x-publish-time',                   // 消息生产时间戳
    retryTimes = 'x-retry-times',                     // 消费重试次数
}

/**
 * 队列生产事件
 */
export enum ProducerEvents {
    publish = 'publish',
}

/**
 * 消费事件
 */
export enum ConsumerEvents {
    run = 'run',
    error = 'error',
    finish = 'finish',
    retry = 'retry',
}

/**
 * RabbitMQ 默认配置
 */
export const DefaultConfig = {
    // 默认分发策略
    exchangeType: ExchangeType.fanout,
    // 默认分发标识
    routingKey: '',
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
 * 默认停止等待时间
 */
export const defaultStopTimeout = 10000;
