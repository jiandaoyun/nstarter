import { Client, handleUnaryCall, Metadata, ServiceError } from '@grpc/grpc-js';
import _ from 'lodash';
import 'reflect-metadata';
import { CLIENT_META, DEFAULT_PKG } from '../constants';
import { getGrpcServiceClient } from '../lib';
import { getRpcName, upperFirst } from '../utils';

/**
 * gRPC 客户端类装饰器
 * @param pkg
 * @param service
 */
export function grpcClient<T extends Function>(pkg?: string, service?: string) {
    return (constructor: T) => {
        const rpcPkg = pkg || DEFAULT_PKG;
        const serviceName = service || getRpcName(constructor.name);
        Reflect.defineMetadata(CLIENT_META, {
            rpcPkg,
            serviceName
        }, constructor);
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
        descriptor.value = async (...args: any[]) => {
            const client = await _getClient(target);
            const path = upperFirst(key);
            const method = _.get(client, ['__proto__', path]);
            if (method) {
                return method.apply(client, args);
            } else {
                throw new Error(`Grpc service method '${ path }' not found.`);
            }
        };
    };
}

/**
 * 单参数 gRPC 调用方法装饰器
 */
export function grpcUnaryCall<T, R>() {
    return (
        target: any,
        key: string,
        descriptor: PropertyDescriptor
    ) => {
        descriptor.value = async (conf: T) => {
            const client = await _getClient(target);
            const path = upperFirst(key);
            const method: handleUnaryCall<T, R> | undefined = _.get(client, ['__proto__', path]);
            if (method) {
                return new Promise((resolve, reject) => {
                    method.apply(client, [conf, (err: ServiceError, value: R | null) => {
                        if (err) {
                            const meta = err.metadata?.getMap();
                            if (meta) {
                                // 注入额外错误 meta 信息
                                _.extend(err, {
                                    ...meta,
                                    errcode: _.toNumber(meta.errcode),
                                    errmsg: err.details
                                });
                            }
                            reject(err);
                        } else {
                            resolve(value);
                        }
                    }]);
                });
            } else {
                throw new Error(`Grpc service method '${ path }' not found.`);
            }
        };
    };
}

/**
 * 获取gRPC Client实例
 */
const _getClient = async (target: any): Promise<Client> => {
    const constructor = target.constructor;
    const { rpcPkg, serviceName, client } = Reflect.getMetadata(CLIENT_META, constructor);
    if (!client) {
        const newClient = await getGrpcServiceClient(rpcPkg, serviceName);
        Reflect.defineMetadata(CLIENT_META, { client: newClient }, constructor);
        return newClient;
    } else {
        return client;
    }
};
