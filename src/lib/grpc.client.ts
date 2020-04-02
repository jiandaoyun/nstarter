import grpc, { Client } from "grpc";

import { IClientConfig } from '../types';
import { getProtoServiceClient } from './proto';

export const clientRegistry = new Map<string, string>();

/**
 * 注册 client 配置
 * @param conf
 */
export const registerGrpcClientConfig = (conf: IClientConfig) => {
    clientRegistry.set(conf.package, conf.address);
};

/**
 * 根据 proto-buf 定义加载 gRPC 服务客户端
 * @param pkg
 * @param service
 */
export const getGrpcServiceClient = (pkg: string, service: string): Client => {
    const GrpcClient = getProtoServiceClient(pkg, service);
    if (GrpcClient && clientRegistry.has(pkg)) {
        return new GrpcClient(clientRegistry.get(pkg), grpc.credentials.createInsecure());
    } else {
        // 客户端未定义
        throw new Error(`Grpc client '${ pkg }.${ service }' not found.`)
    }
};
