import { ExchangeType, IQueueMessage, queueConsumerFactory, queueFactory, queueProducerFactory } from '../src';
import { amqp } from './amqp';

describe('test: basic', () => {

    const normalQueue = queueFactory(amqp.connection, {
        queue: {
            name: 'test:normal',
            routingKey: 'normal',
            options: {
                durable: false,
                autoDelete: true
            }
        },
        exchange: {
            name: 'test:normal',
            type: ExchangeType.fanout,
            options: {
                durable: false,
                autoDelete: true
            }
        }
    });

    const producer = queueProducerFactory(normalQueue);
    const consumer = queueConsumerFactory(normalQueue, {
        run: async (message: IQueueMessage<string>): Promise<void> => {
            console.log(message.content);
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

    it('producer.publish', async() => {
        await producer.publish('test:normal');
    });

    after(async () => {
        await consumer.stop();
    });
});
