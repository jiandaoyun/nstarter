import grpc, { Client } from 'grpc';

import { IClientConfig } from '../types';
import { getProtoServiceClient } from './proto';

export const clientRegistry = new Map<string, IClientConfig>();

/**
 * 注册 client 配置
 * @param conf
 */
export const registerGrpcClientConfig = (conf: IClientConfig) => {
    clientRegistry.set(conf.package, conf);
};

/**
 * 根据 proto-buf 定义加载 gRPC 服务客户端
 * @param pkg
 * @param service
 */
export const getGrpcServiceClient = (pkg: string, service: string): Client => {
    const GrpcClient = getProtoServiceClient(pkg, service);
    const clientConfig = clientRegistry.get(pkg);
    if (GrpcClient && clientConfig) {
        return new GrpcClient(
            clientConfig.address,
            clientConfig.useSsl ? grpc.credentials.createSsl() : grpc.credentials.createInsecure()
        );
    } else {
        // 客户端未定义
        throw new Error(`Grpc client '${ pkg }.${ service }' not found.`);
    }
};
