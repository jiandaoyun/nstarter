import os from 'os';
import { AmqpConnectionManager, AmqpConnectionManagerClass } from 'amqp-connection-manager';
import { RabbitMQConfig } from '../types';

/**
 * Rabbitmq 连接管理器
 */
export class AmqpConnector {
    public connection: AmqpConnectionManager;
    private readonly _config: RabbitMQConfig;

    constructor(config: RabbitMQConfig) {
        this._config = config;
        const { heartbeatInterval, reconnectInterval } = this._config;
        this.connection = new AmqpConnectionManagerClass(this.amqpUrls, {
            heartbeatIntervalInSeconds: heartbeatInterval,
            reconnectTimeInSeconds: reconnectInterval,
            connectionOptions: {
                clientProperties: {
                    // @see https://www.rabbitmq.com/connections.html#client-provided-names
                    connection_name: os.hostname(),
                    ...config.client
                }
            }
        });
    }

    /**
     * 建立连接
     */
    public async connect() {
        return await this.connection.connect();
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

