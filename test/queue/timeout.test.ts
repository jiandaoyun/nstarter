import chai from 'chai';

import {
    ConsumerEvents,
    IQueueMessage,
    IQueueProducer,
    queueConsumerFactory,
    queueFactory,
    queueProducerFactory,
    RetryMethod
} from '../../src';
import { amqp, delayQueueConf } from '../amqp';
import { sleep } from '../../src/utils';
import { RabbitMqConsumer } from '../../src/lib/rabbitmq.consumer';

const expect = chai.expect;

describe('test: timeout', () => {
    const queue = queueFactory<number>(amqp.connection, delayQueueConf);
    let producer: IQueueProducer<number>,
        consumer: RabbitMqConsumer<number>;

    before(async () => {
        producer = queueProducerFactory(queue, {
            pushDelay: 100
        });
        await producer.setup();
    });

    it('republish timeout', (done) => {
        let count = 0;
        consumer = queueConsumerFactory<number>(queue, {
            retryMethod: RetryMethod.republish,
            retryTimes: 5,
            retryDelay: 100,
            timeout: 200,
            run: async (message: IQueueMessage<number>) => {
                console.debug(`runAt: ${ Date.now() } / ${ count }`);
                count ++;
                await sleep(200);
                if (count < message.content) {
                    throw Error('run failed');
                }
                console.log('run success');
            }
        });
        consumer.start();
        consumer.on(ConsumerEvents.error, (err: Error, message: IQueueMessage<number>) => {
            expect(err).to.exist;
            expect(message).to.exist;
            done();
        });
        producer.publish(5);
    });

    after(async() => {
        await sleep(200);
        await consumer.stop();
    });
});
