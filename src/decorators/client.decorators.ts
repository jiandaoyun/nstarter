import 'reflect-metadata';

import { StreamingCallback, UnaryCallback } from '../types';
import { getRpcName, upperFirst } from '../utils';
import { CLIENT_META, DEFAULT_PKG } from '../constants';
import { getGrpcServiceClient } from '../lib';

/**
 * gRPC 客户端类装饰器
 * @param pkg
 * @param service
 */
export function grpcClient<T extends Function>(pkg?: string, service?: string) {
    return (constructor: T) => {
        const rpcPkg = pkg || DEFAULT_PKG;
        const target = constructor;
        const serviceName = service || getRpcName(constructor.name);
        // gRPC 客户端注册
        Reflect.defineMetadata(CLIENT_META, {
            client: getGrpcServiceClient(rpcPkg, serviceName)
        }, target);
    };
}

/**
 * 调用方法生成工具方法
 * @param target
 * @param key
 * @private
 */
const _callMethodFactory = <T, C>(target: any, key: string) =>
    (conf: T, callback: C) => {
        const path = upperFirst(key);
        const { client } = Reflect.getMetadata(CLIENT_META, target);
        if (client.hasOwnProperty(path)) {
            client[path].apply(null, [conf, callback]);
        }
        return;
    };

/**
 * 单参数 gRPC 调用方法装饰器
 */
export function grpcUnaryCall<T, R>() {
    return (
        target: any,
        key: string,
        descriptor: PropertyDescriptor
    ) => {
        descriptor.value = _callMethodFactory<T, UnaryCallback<R>>(target, key);
    };
}

/**
 * 流式 gRPC 调用方法装饰器
 */
export function grpcStreamingCall<T, R>() {
    return (
        target: any,
        key: string,
        descriptor: PropertyDescriptor
    ) => {
        descriptor.value = _callMethodFactory<T, StreamingCallback<R>>(target, key);
    };
}
