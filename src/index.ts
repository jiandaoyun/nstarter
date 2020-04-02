export * from './types';

export { registerGrpcClientConfig, bindGrpcServer } from './lib';
export {
    grpcClient,
    grpcUnaryCall,
    grpcServerStreamingCall,

    grpcService,
    grpcUnaryMethod,
    grcpStreamingMethod
} from './decorators';
