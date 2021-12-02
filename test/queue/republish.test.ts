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
import { BaseContext, ContextProvider } from 'nstarter-core';

const expect = chai.expect;

describe('test: republish', () => {
    context('republish success', () => {
        const queue = queueFactory<number>(amqp.connection, normalQueueConf);
        let producer: RabbitMqProducer<number>,
            consumer: RabbitMqConsumer<number>;

        before(async () => {
            producer = queueProducerFactory(queue);
            ContextProvider.initialize(BaseContext);
            await producer.setup();
        });

        it('republish success', (done) => {
            let count = 0;
            consumer = queueConsumerFactory<number>(queue, {
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
                }
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
            await sleep(300);
            await consumer.stop();
        });
    });

    context('republish fail', () => {
        const queue = queueFactory<number>(amqp.connection, normalQueueConf);
        let producer: RabbitMqProducer<number>,
            consumer: RabbitMqConsumer<number>;

        before(async () => {
            producer = queueProducerFactory(queue, {
                pushRetryTimes: 3
            })
            await producer.setup();
        });

        it('republish fail', (done) => {
            let count = 0;
            consumer = queueConsumerFactory<number>(queue, {
                retryMethod: RetryMethod.republish,
                retryTimes: 2,
                retryDelay: 50,
                run: async (message: IQueueMessage<number>): Promise<void> => {
                    count ++;
                    if (count < message.content) {
                        throw Error('run failed');
                    }
                }
            });
            consumer.start();
            sleep(100);
            consumer.on(ConsumerEvents.error,  (err, message) => {
                expect(err).to.exist;
                expect(message).to.exist;
                if (count > 1) {
                    done();
                } else {
                    throw Error('error');
                }
            });
            producer.publish(5);
        });

        after(async() => {
            await sleep(300);
            await consumer.stop();
        });
    });
});
