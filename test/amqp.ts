import { AmqpConnector, ExchangeType, RabbitProps } from '../src';
import { rabbitmqConf } from './config';

export const amqp = new AmqpConnector(rabbitmqConf, (err) => {
    console.error(`Rabbitmq disconnected`);
    console.error(err.err.message);
});

export const normalQueueConf = {
    queue: {
        name: 'test:normal',
        routingKey: 'normal',
        options: {
            durable: false,
            autoDelete: false
        }
    },
    exchange: {
        name: 'test:normal',
        type: ExchangeType.fanout,
        options: {
            durable: false,
            autoDelete: false
        }
    }
};

export const delayQueueConf = {
    queue: {
        name: 'test:delay',
        routingKey: 'delay',
        options: {
            durable: false,
            autoDelete: false
        }
    },
    exchange: {
        name: 'test:delay',
        type: ExchangeType.delay,
        options: {
            durable: false,
            autoDelete: false,
            arguments: {
                [RabbitProps.delayDeliverType]: ExchangeType.fanout
            }
        }
    }
}
