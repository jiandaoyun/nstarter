import {
    AmqpConnector,
    ExchangeType,
    IQueueMessage,
    queueConsumerFactory,
    queueFactory,
    queueProducerFactory
} from '../src';
import { rabbitmqConf } from './config';

export const amqp = new AmqpConnector(rabbitmqConf, (err) => {
    console.error(`Rabbitmq disconnected`);
});

export const demoQueue = queueFactory(amqp.connection, {
    queue: {
        name: 'demo:normal',
        routingKey: 'normal',
        options: {
            durable: false,
            autoDelete: true
        }
    },
    exchange: {
        name: 'demo:normal',
        type: ExchangeType.fanout,
        options: {
            durable: false,
            autoDelete: true
        }
    }
});

export const demoProducer = queueProducerFactory(demoQueue);

export const demoConsumer = queueConsumerFactory(demoQueue, {
    run: async (message: IQueueMessage<string>): Promise<void> => {
        console.log(message.content);
    }
});

describe('demoQueue', () => {
    it('register', async () => {
        await demoConsumer.register();
    });

    it('setup', async () => {
        await demoProducer.setup();
    });

    it('publish', async() => {
        await demoProducer.publish('demo:normal');
    });
});
