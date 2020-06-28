import {
    ConsumerEvents,
    IQueueMessage,
    ProducerEvents,
    queueConsumerFactory,
    queueFactory,
    queueProducerFactory,
    startQueueConsumers,
    stopQueueConsumers
} from '../../src';
import { amqp, normalQueueConf } from '../amqp';
import { sleep } from '../../src/utils';

describe('test: basic', () => {
    const queue = queueFactory(amqp.connection, normalQueueConf);

    const producer = queueProducerFactory(queue);
    producer.on(ProducerEvents.publish, (content) => {
        console.log(`${ producer.queue.name } published.`);
    })
    const consumer = queueConsumerFactory(queue, {
        run: async (message: IQueueMessage<string>): Promise<void> => {
            console.log(message.content);
            await sleep(10);
        }
    });
    consumer.on(ConsumerEvents.finish, (message) => {
        console.log(`${ consumer.queue.name } finished.`);
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
        await sleep(100);
        await stopQueueConsumers();
    });
});
