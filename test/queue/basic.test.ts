import {
    ExchangeType,
    IQueueMessage,
    queueConsumerFactory,
    queueFactory,
    queueProducerFactory,
    startQueueConsumers
} from '../../src';
import { amqp, normalQueueConf } from '../amqp';

describe('test: basic', () => {
    const queue = queueFactory(amqp.connection, normalQueueConf);

    const producer = queueProducerFactory(queue);
    const consumer = queueConsumerFactory(queue, {
        run: async (message: IQueueMessage<string>): Promise<void> => {
            console.log(message.content);
        }
    });

    it('consumer.register', async () => {
        await consumer.register();
    });

    it('consumer.start', async () => {
        await startQueueConsumers();
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
