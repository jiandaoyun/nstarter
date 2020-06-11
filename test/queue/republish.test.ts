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
import { sleep } from '../../src/utils';

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
                error: (err, message) => {
                    expect(err).to.not.exist;
                    expect(message).to.exist;
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
                retryDelay: 50,
                run: async (message: IQueueMessage<number>): Promise<void> => {
                    count ++;
                    if (count < message.content) {
                        throw Error('run failed');
                    }
                },
                error: (err, message) => {
                    expect(err).to.exist;
                    expect(message).to.exist;
                    if (count > 1) {
                        done();
                    } else {
                        throw Error('error');
                    }
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

    context('republish unhandled', () => {
        const queue = queueFactory(amqp.connection, normalQueueConf);
        let producer: IQueueProducer<number>,
            consumer: IQueueConsumer<number>;

        before(async () => {
            producer = queueProducerFactory(queue);
            await producer.setup();
        });

        it('undefined republish', async () => {
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
                }
            });
            await consumer.start();
            await producer.publish(5);
        });

        after(async() => {
            await sleep(300);
            await consumer.stop();
        });
    });
});
