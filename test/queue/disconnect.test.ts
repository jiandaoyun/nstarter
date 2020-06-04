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
        name: 'test:normal',
        maxLength: 100
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
