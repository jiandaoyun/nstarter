import type { Client, handleClientStreamingCall, handleUnaryCall, ServiceError } from '@grpc/grpc-js';
import _ from 'lodash';
import 'reflect-metadata';
import { CLIENT_META, DEFAULT_PKG } from '../constants';
import { getGrpcServiceClient } from '../lib';
import type { StreamResult } from '../types';
import { deserializeError, getRpcName, upperFirst } from '../utils';

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
            const method: handleClientStreamingCall<T, R> = _.get(client, ['__proto__', path]);
            if (method) {
                const stream: StreamResult<R> = method.apply(client, args);
                if (stream) {
                    const oriFunc = stream.on;
                    stream.on = function on(event: string | symbol, listener: (...args: any[]) => void) {
                        if (event === 'error') {
                            oriFunc.apply(this, [event, (err: ServiceError) => {
                                listener(deserializeError(err));
                            }]);
                        } else {
                            oriFunc.apply(this, [event, listener]);
                        }
                        return this;
                    };
                }
                return stream;
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
                            reject(deserializeError(err));
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
