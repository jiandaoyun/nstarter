import grpc from 'grpc';

export const server = new grpc.Server();

export const bindGrpcServer = (port: number | string) => {
    server.bind(`0.0.0.0:${ port }`, grpc.ServerCredentials.createInsecure());
};
