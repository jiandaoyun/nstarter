import AmqpConnectManager, { AmqpConnectionManager } from 'amqp-connection-manager';
import { RabbitMQConfig } from '../types';

export class AmqpConnector {
    public connection: AmqpConnectionManager;
    private readonly _config: RabbitMQConfig;

    constructor(config: RabbitMQConfig, errorHandler?: Callback) {
        this._config = config;
        const { heartbeatInterval, reconnectInterval } = this._config;
        this.connection = AmqpConnectManager.connect(this.amqpUrls, {
            heartbeatIntervalInSeconds: heartbeatInterval,
            reconnectTimeInSeconds: reconnectInterval
        });
        this.connection.once('connect', () => {
            this.connection.on('disconnect', (err?: Error) => {
                if (err && errorHandler) {
                    errorHandler(err);
                } else {
                    console.error('Rabbitmq disconnect unhandled.');
                }
            });
        });
    }

    private get amqpUrls(): string[] {
        const { user, password, protocol, brokers } = this._config,
            vhost = encodeURIComponent(this._config.vhost || '/');
        return brokers.map((broker) => {
            const { host, port = 5672 } = broker;
            return `${ protocol }://${ user }:${ password }@${ host }:${ port }/${ vhost }`;
        });
    }
}

