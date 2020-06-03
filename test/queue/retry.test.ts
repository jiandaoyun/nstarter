import chai from 'chai';

import {
    IQueueConsumer,
    IQueueMessage, IQueueProducer,
    queueConsumerFactory,
    queueFactory,
    queueProducerFactory,
    RetryMethod
} from '../../src';
import { amqp, normalQueueConf } from '../amqp';
import { sleep } from '../utils';
import { createDeflateRaw } from 'zlib';
import { spawn } from 'child_process';

const expect = chai.expect;

describe('test: retry', () => {
    context('retry success', () => {
        const queue = queueFactory(amqp.connection, normalQueueConf);
        let producer: IQueueProducer<number>,
            consumer: IQueueConsumer<number>;

        before(async () => {
            producer = queueProducerFactory(queue);
            await producer.setup();
        });

        it('retry success', (done) => {
            let count = 0;
            consumer = queueConsumerFactory(queue, {
                retryMethod: RetryMethod.retry,
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
                error: async(err, message) => {
                    await expect(err).to.not.exist;
                    await expect(message).to.exist;
                }
            });
            consumer.start();
            producer.publish(2);
        });

        after(async () => {
            await sleep(100);
            await consumer.stop();
        });
    });

    context('retry fail', () => {
        const queue = queueFactory(amqp.connection, normalQueueConf);
        let producer: IQueueProducer<number>,
            consumer: IQueueConsumer<number>;

        before(async () => {
            producer = queueProducerFactory(queue);
            await producer.setup();
        });

        it('retry fail', (done) => {
            let count = 0;
            consumer = queueConsumerFactory(queue, {
                retryMethod: RetryMethod.retry,
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
                }
            });
            consumer.start();
            producer.publish(5);
        });

        after(async() => {
            await sleep(100);
            await consumer.stop();
        });
    });

    context('retry unhandled', () => {
        const queue = queueFactory(amqp.connection, normalQueueConf);
        let producer: IQueueProducer<number>,
            consumer: IQueueConsumer<number>;

        before(async () => {
            producer = queueProducerFactory(queue);
            await producer.setup();
        });

        it('unhandled error', async () => {
            let count = 0;
            consumer = queueConsumerFactory(queue, {
                retryMethod: RetryMethod.retry,
                retryTimes: 2,
                retryDelay: 0,
                run: async (message: IQueueMessage<number>): Promise<void> => {
                    count ++;
                    if (count < message.content) {
                        throw Error('run failed');
                    }
                },
            });
            await consumer.start();
            await producer.publish(5);
        });

        after(async() => {
            await sleep(100);
            await consumer.stop();
        });
    });
});
