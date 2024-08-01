import { AmqpConnector, IQueueConfig } from '../src';
import { rabbitmqConf } from './config';

export const amqp = new AmqpConnector(rabbitmqConf);

export const normalQueueConf: IQueueConfig = {
    name: 'test:normal',
    maxLength: 100,
    prefetch: 10
};
