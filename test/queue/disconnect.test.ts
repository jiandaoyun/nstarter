import chai from 'chai';

import { AmqpConnector, queueFactory, } from '../../src';
import { rabbitmqConf } from '../config';
import { sleep } from 'nstarter-utils';

const expect = chai.expect;

describe('test: disconnect', () => {
    const queueOptions = {
        name: 'test:normal',
        prefetch: 0,
        maxLength: 0
    };

    it('disconnect', async () => {
        const connector = new AmqpConnector(rabbitmqConf);
        try {
            await connector.connect();
        } catch (err) {
            expect(err).to.exist;
            await connector.connection.close();
        }
        queueFactory(connector.connection, queueOptions);
    });

    it('disconnect unhandle', async () => {
        const connector = new AmqpConnector(rabbitmqConf);
        await connector.connect();
        const { connection } = connector;
        queueFactory(connection, queueOptions);
        await sleep(500);
        await connection.close();
    });
});
