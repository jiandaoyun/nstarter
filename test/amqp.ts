import { AmqpConnector } from '../src';
import { rabbitmqConf } from './config';

export const amqp = new AmqpConnector(rabbitmqConf, (err) => {
    console.error(`Rabbitmq disconnected`);
    console.error(err.err.message);
});
