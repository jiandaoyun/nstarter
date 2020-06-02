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

describe('test: retry', () => {
    const normalQueue = queueFactory(amqp.connection, {
        queue: {
            name: 'test:retry',
            routingKey: 'normal',
            options: {
                durable: false,
                autoDelete: true
            }
        },
        exchange: {
            name: 'test:retry',
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
        retryMethod: RetryMethod.retry,
        retryTimes: 2,
        retryDelay: 0,
        run: async (message: IQueueMessage<number>): Promise<void> => {
            console.log(`run: ${ count }`);
            count ++;
            if (count < message.content) {
                throw Error('run failed');
            }
            console.log('run success');
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
        // retry success
        count = 0;
        await producer.publish(1);
        await sleep(1000);
    });

    it('retry fail', async() => {
        // retry fail
        count = 0;
        await producer.publish(5);
        await sleep(1000);
    });

    after(async () => {
        await consumer.stop();
    });
});
