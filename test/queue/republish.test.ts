import {
    ExchangeType,
    IQueueMessage,
    queueConsumerFactory,
    queueFactory,
    queueProducerFactory,
    RetryMethod
} from '../../src';
import { amqp } from '../amqp';
import { sleep } from '../utils';

describe('test: republish', () => {
    const normalQueue = queueFactory(amqp.connection, {
        queue: {
            name: 'test:republish',
            routingKey: 'normal',
            options: {
                durable: false,
                autoDelete: true
            }
        },
        exchange: {
            name: 'test:republish',
            type: ExchangeType.fanout,
            options: {
                durable: false,
                autoDelete: true
            }
        }
    });

    let count = 0;
    const producer = queueProducerFactory(normalQueue);
    const consumer = queueConsumerFactory(normalQueue, {
        retryMethod: RetryMethod.republish,
        retryTimes: 2,
        retryDelay: 0,
        run: async (message: IQueueMessage<number>) => {
            console.log(`run: ${ count }`);
            count ++;
            if (count < message.content) {
                throw Error('run failed');
            }
            console.log('run success');
        },
        republish: async (content, options) => {
            return producer.publish(content, options);
        },
        error: async(err, message) => {
            console.error(err.message);
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

    it('retry success', async() => {
        count = 0;
        await producer.publish(1);
        await sleep(1000);
    });

    it('retry fail', async() => {
        count = 0;
        await producer.publish(5);
        await sleep(1000);
    });

    after(async () => {
        await consumer.stop();
    });
});
