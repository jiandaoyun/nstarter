import {
    ExchangeType,
    IQueueMessage,
    queueConsumerFactory,
    queueFactory,
    queueProducerFactory, RabbitProps,
    RetryMethod
} from '../../src';
import { amqp } from '../amqp';
import { sleep } from '../utils';

describe('test: timeout', () => {
    const queue = queueFactory(amqp.connection, {
        queue: {
            name: 'test:timeout',
            routingKey: 'timeout',
            options: {
                durable: false,
                autoDelete: true
            }
        },
        exchange: {
            name: 'test:timeout',
            type: ExchangeType.delay,
            options: {
                durable: false,
                autoDelete: true,
                arguments: {
                    [RabbitProps.delayDeliverType]: ExchangeType.fanout
                }
            }
        },
        prefetch: 0
    });

    let count = 0;
    const producer = queueProducerFactory(queue, {
        pushDelay: 100,
    });
    const consumer = queueConsumerFactory(queue, {
        retryMethod: RetryMethod.republish,
        retryTimes: 5,
        retryDelay: 100,
        timeout: 200,
        run: async (message: IQueueMessage<number>) => {
            console.log(`runAt: ${ Date.now() } / ${ count }`);
            count ++;
            if (count < message.content) {
                throw Error('run failed');
            }
            console.log('run success');
        },
        republish: async (content, options) => {
            return producer.publish(content, options);
        }
    });

    it('consumer.register', async () => {
        await consumer.register();
    });

    it('consumer.start', async () => {
        await consumer.start();
    });

    it('producer.setup', async () => {
        await producer.setup();
    });

    it('retry timeout', async() => {
        count = 0;
        await producer.publish(5);
        await sleep(1000);
    });

    after(async () => {
        await consumer.stop();
    });
});
