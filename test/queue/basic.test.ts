import {
    IQueueMessage,
    queueConsumerFactory,
    queueFactory,
    queueProducerFactory,
    startQueueConsumers
} from '../../src';
import { amqp, normalQueueConf } from '../amqp';
import { sleep } from '../utils';

describe('test: basic', () => {
    const queue = queueFactory(amqp.connection, normalQueueConf);

    const producer = queueProducerFactory(queue, {
        onPublish: (content, queue) => {
            console.log(`${ queue.name } published.`);
        }
    });
    const consumer = queueConsumerFactory(queue, {
        run: async (message: IQueueMessage<string>): Promise<void> => {
            console.log(message.content);
            await sleep(10);
        },
        onFinish: (message, queue) => {
            console.log(`${ queue.name } finished.`);
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
        await sleep(100);
        await consumer.stop();
    });
});
