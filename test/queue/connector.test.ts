import { AmqpConnector } from '../../src';

describe('test: connector', () => {
    it('alternative config', async() => {
        const conf = {
            user: 'user',
            password: '89KfbL1Wa7bq7H9FbA4Xx3aR',
            brokers: [{
                host: '172.24.3.11'
            }],
            protocol: 'amqp',
            heartbeatInterval: 120,
            reconnectInterval: 1
        };
        new AmqpConnector(conf);
    });
});
