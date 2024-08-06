import type { IServerConfig } from '../types';
import { Server, ServerCredentials } from '@grpc/grpc-js';

export const server = new Server();

export const startGrpcServer = async (conf: IServerConfig) => {
    await new Promise((resolve, reject) => {
        server.bindAsync(`0.0.0.0:${ conf.port }`, ServerCredentials.createInsecure(), (err: Error | null) => {
            if (err) {
                reject(err);
            } else {
                resolve(undefined);
            }
        });
    });
};

export const stopGrpcServer = async () => {
    await new Promise((resolve, reject) => {
        server.tryShutdown((err?: Error) => {
            if (err) {
                reject(err);
            } else {
                resolve(undefined);
            }
        });
    });
};
