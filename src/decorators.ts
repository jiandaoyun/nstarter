import { TransactionOptions } from 'mongodb';
import { ClientSession } from 'mongoose';
import { defaultConnection } from './connector';

const SESSION_IDX = 'mongodb:sess_idx';

function getMetadataKey(propertyKey: string) {
    return `${ SESSION_IDX }:${ propertyKey }`;
}

/**
 *
 * @param options
 * @param connection
 */
export function transaction(options?: TransactionOptions, connection = defaultConnection) {
    if (!connection) {
        throw new Error('Default mongodb connection is not set');
    }
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const func = descriptor.value;
        descriptor.value = async (...args: any[]) => {
            const session = await connection.startSession();
            let result = null;
            // @see http://mongodb.github.io/node-mongodb-native/3.3/api/ClientSession.html#withTransaction
            // @see https://github.com/mongodb/node-mongodb-native/blob/dc70c2de7d3dae2617708c45a1ea695d131e15f3/test/examples/transactions.js
            await session.withTransaction(async (session: ClientSession) => {
                const sessionIdx = Reflect.getMetadata(getMetadataKey(propertyKey), target);
                if (sessionIdx >= 0) {
                    args[sessionIdx] = args[sessionIdx] || session;
                } else {
                    session.endSession();
                    throw new Error('No session configured for transaction.');
                }
                result = await func.apply(target, args);
                return result;
            }, {
                writeConcern: { w: 'majority' },
                readPreference: 'primary',
                ...options
            });
            session.endSession();
            return result;
        };
    };
}

/**
 *
 * @param target
 * @param propertyKey
 * @param parameterIndex
 */
export function repoSession(target: any, propertyKey: string, parameterIndex: number) {
    Reflect.defineMetadata(getMetadataKey(propertyKey), parameterIndex, target);
}
