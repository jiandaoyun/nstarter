import chai from 'chai';

import {
    AmqpConnector,
    ExchangeType,
    queueFactory,
    RabbitProps
} from '../../src';
import { sleep } from '../utils';
import { rabbitmqConf } from '../config';

const expect = chai.expect;

describe('test: disconnect', () => {
    const queueOptions = {
        queue: {
            name: 'test:error',
            routingKey: 'error',
            options: {
                durable: false,
                autoDelete: false
            }
        },
        exchange: {
            name: 'test:error',
            type: ExchangeType.delay,
            options: {
                durable: false,
                autoDelete: false,
                arguments: {
                    [RabbitProps.delayDeliverType]: 'non-exist'
                }
            }
        },
        prefetch: 0
    };

    it('disconnect', (done) => {
        const amqp = new AmqpConnector(rabbitmqConf, (err) => {
            expect(err).to.exist;
            amqp.connection.close();
            return done();
        });
        queueFactory(amqp.connection, queueOptions);
    });

    it('disconnect unhandle', async () => {
        const amqp = new AmqpConnector(rabbitmqConf);
        queueFactory(amqp.connection, queueOptions);
        await sleep(500);
        await amqp.connection.close();
    });
});
