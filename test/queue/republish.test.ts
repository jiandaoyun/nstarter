import chai from 'chai';

import {
    IQueueConsumer,
    IQueueMessage, IQueuePayload, IQueueProducer,
    queueConsumerFactory,
    queueFactory,
    queueProducerFactory,
    RetryMethod
} from '../../src';
import { amqp, normalQueueConf } from '../amqp';
import { sleep } from '../utils';

const expect = chai.expect;

describe('test: republish', () => {
    context('republish success', () => {
        const queue = queueFactory(amqp.connection, normalQueueConf);
        let producer: IQueueProducer<number>,
            consumer: IQueueConsumer<number>;

        before(async () => {
            producer = queueProducerFactory(queue);
            await producer.setup();
        });

        it('republish success', (done) => {
            let count = 0;
            consumer = queueConsumerFactory(queue, {
                retryMethod: RetryMethod.republish,
                retryTimes: 2,
                retryDelay: 0,
                run: async (message: IQueueMessage<number>): Promise<void> => {
                    count ++;
                    if (count < message.content) {
                        throw Error('run failed');
                    }
                    expect(count).to.equal(2);
                    expect(message).to.exist;
                    console.log('run success');
                    done();
                },
                error: async (err, message) => {
                    await expect(err).to.not.exist;
                    await expect(message).to.exist;
                },
                republish: async (content: IQueuePayload<number>, options) => {
                    return producer.publish(content, options);
                }
            });
            consumer.start();
            producer.publish(2);
        });

        after(async () => {
            await sleep(300);
            await consumer.stop();
        });
    });

    context('republish fail', () => {
        const queue = queueFactory(amqp.connection, normalQueueConf);
        let producer: IQueueProducer<number>,
            consumer: IQueueConsumer<number>;

        before(async () => {
            producer = queueProducerFactory(queue)
            await producer.setup();
        });

        it('republish fail', (done) => {
            let count = 0;
            consumer = queueConsumerFactory(queue, {
                retryMethod: RetryMethod.republish,
                retryTimes: 2,
                retryDelay: 0,
                run: async (message: IQueueMessage<number>): Promise<void> => {
                    count ++;
                    if (count < message.content) {
                        throw Error('run failed');
                    }
                },
                error: async (err, message) => {
                    await expect(err).to.exist;
                    await expect(message).to.exist;
                    done();
                },
                republish: async (content: IQueuePayload<number>, options) => {
                    return producer.publish(content, options);
                }
            });
            consumer.start();
            producer.publish(5);
        });

        after(async() => {
            await sleep(300);
            await consumer.stop();
        });
    });
});
