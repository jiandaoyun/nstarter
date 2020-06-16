import chai from 'chai';

import {
    ConsumerEvents,
    IQueueMessage,
    queueConsumerFactory,
    queueFactory,
    queueProducerFactory, RabbitMqConsumer, RabbitMqProducer,
    RetryMethod
} from '../../src';
import { amqp, normalQueueConf } from '../amqp';
import { sleep } from '../../src/utils';

const expect = chai.expect;

describe('test: retry', () => {
    context('retry success', () => {
        const queue = queueFactory<number>(amqp.connection, normalQueueConf);
        let producer: RabbitMqProducer<number>,
            consumer: RabbitMqConsumer<number>;

        before(async () => {
            producer = queueProducerFactory(queue);
            await producer.setup();
        });

        it('retry success', (done) => {
            let count = 0;
            consumer = queueConsumerFactory<number>(queue, {
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
            });
            consumer.start();
            sleep(100);
            consumer.on(ConsumerEvents.error, (err, message) => {
                expect(err).to.not.exist;
                expect(message).to.exist;
            });
            producer.publish(2);
        });

        after(async () => {
            await sleep(150);
            await consumer.stop();
        });
    });

    context('retry fail', () => {
        const queue = queueFactory<number>(amqp.connection, normalQueueConf);
        let producer: RabbitMqProducer<number>,
            consumer: RabbitMqConsumer<number>;

        before(async () => {
            producer = queueProducerFactory(queue);
            await producer.setup();
        });

        it('retry fail', (done) => {
            let count = 0;
            consumer = queueConsumerFactory<number>(queue, {
                retryMethod: RetryMethod.retry,
                retryTimes: 2,
                retryDelay: 0,
                run: async (message: IQueueMessage<number>): Promise<void> => {
                    count ++;
                    if (count < message.content) {
                        throw Error('run failed');
                    }
                }
            });
            consumer.on(ConsumerEvents.error, (err, message) => {
                expect(err).to.exist;
                expect(message).to.exist;
                done();
            });
            consumer.start();
            sleep(100);
            producer.publish(5);
        });

        after(async() => {
            await sleep(200);
            await consumer.stop();
        });
    });

    context('retry unhandled', () => {
        const queue = queueFactory<number>(amqp.connection, normalQueueConf);
        let producer: RabbitMqProducer<number>,
            consumer: RabbitMqConsumer<number>;

        before(async () => {
            producer = queueProducerFactory(queue);
            await producer.setup();
        });

        it('unhandled error', async () => {
            let count = 0;
            consumer = queueConsumerFactory<number>(queue, {
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
            await sleep(200);
            await consumer.stop();
        });
    });

    context('no retry', () => {
        const queue = queueFactory<number>(amqp.connection, normalQueueConf);
        let producer: RabbitMqProducer<number>,
            consumer: RabbitMqConsumer<number>;

        before(async () => {
            producer = queueProducerFactory(queue);
            await producer.setup();
        });

        it('unhandled error', (done) => {
            let count = 0;
            consumer = queueConsumerFactory<number>(queue, {
                retryMethod: RetryMethod.none,
                run: async (message: IQueueMessage<number>): Promise<void> => {
                    count ++;
                    if (count < message.content) {
                        throw Error('run failed');
                    }
                },
            });
            consumer.start();
            sleep(100);
            producer.publish(5);
            consumer.on(ConsumerEvents.error, (err, message) => {
                expect(err).to.exist;
                expect(message).to.exist;
                done();
            });
        });

        after(async() => {
            await sleep(200);
            await consumer.stop();
        });
    });
});
