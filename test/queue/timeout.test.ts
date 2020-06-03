import chai from 'chai';

import {
    IQueueConsumer,
    IQueueMessage, IQueuePayload, IQueueProducer,
    queueConsumerFactory,
    queueFactory,
    queueProducerFactory,
    RetryMethod
} from '../../src';
import { amqp, delayQueueConf } from '../amqp';
import { sleep } from '../utils';

const expect = chai.expect;

describe('test: timeout', () => {
    const queue = queueFactory(amqp.connection, delayQueueConf);
    let producer: IQueueProducer<number>,
        consumer: IQueueConsumer<number>;

    before(async () => {
        producer = queueProducerFactory(queue, {
            pushDelay: 100
        });
        await producer.setup();
    });

    it('republish timeout', (done) => {
        let count = 0;
        consumer = queueConsumerFactory(queue, {
            retryMethod: RetryMethod.republish,
            retryTimes: 5,
            retryDelay: 100,
            timeout: 200,
            run: async (message: IQueueMessage<number>) => {
                console.debug(`runAt: ${ Date.now() } / ${ count }`);
                count ++;
                if (count < message.content) {
                    throw Error('run failed');
                }
                console.log('run success');
            },
            republish: async (content: IQueuePayload<number>, options) => {
                return producer.publish(content, options);
            },
            error: async (err: Error, message: IQueueMessage<number>) => {
                expect(err).to.exist;
                expect(message).to.exist;
                expect(count).to.equal(2);
                done();
            }
        });
        consumer.start();
        producer.publish(5);
    });

    after(async() => {
        await sleep(200);
        await consumer.stop();
    });
});
