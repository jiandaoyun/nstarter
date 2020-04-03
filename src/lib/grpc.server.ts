import grpc from 'grpc';
import { IServerConfig } from '../types';

export const server = new grpc.Server();

export const startGrpcServer = (conf: IServerConfig) => {
    server.bind(`0.0.0.0:${ conf.port }`, grpc.ServerCredentials.createInsecure());
    server.start();
};
