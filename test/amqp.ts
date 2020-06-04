import { AmqpConnector, IQueueConfig } from '../src';
import { rabbitmqConf } from './config';

export const amqp = new AmqpConnector(rabbitmqConf, (err) => {
    console.error(`Rabbitmq disconnected`);
    console.error(err.err.message);
});

export const normalQueueConf: IQueueConfig = {
    name: 'test:normal'
};

export const delayQueueConf: IQueueConfig = {
    name: 'test:delay',
    isDelay: true
}
