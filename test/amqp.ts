import { AmqpConnector, IQueueConfig } from '../src';
import { rabbitmqConf } from './config';

export const amqp = new AmqpConnector(rabbitmqConf, (err) => {
    console.error(`Rabbitmq disconnected`);
    console.error(err.err.message);
});

export const normalQueueConf: IQueueConfig = {
    name: 'test:normal',
    maxLength: 100,
    prefetch: 10
};

export const delayQueueConf: IQueueConfig = {
    name: 'test:delay',
    maxLength: 100,
    prefetch: 10,
    isDelay: true
}
