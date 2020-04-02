import 'reflect-metadata';
import {
    handleUnaryCall,
    handleServerStreamingCall,
    handleCall
} from 'grpc';

import { server } from '../lib';
import { GrpcHandler } from '../types';
import { getRpcName, upperFirst } from '../utils';
import { METHOD_PREFIX } from '../constants';
import { getProtoServiceName } from '../lib/proto';

/**
 *
 * @param run
 */
function messageHandler<T, R>(run: handleCall<T, R>) {
    return (
        target: any,
        key: string,
        descriptor: PropertyDescriptor
    ) => {
        const name = upperFirst(key);
        Reflect.defineMetadata(`${ METHOD_PREFIX }${ name }`, { name, method: run }, target);
    };
}

/**
 * gRPC 服务端服务类装饰器
 * @param pkg - gRPC package of current service
 * @param service - Name of gRPC service defined in proto file
 */
export function grpcService<T extends Function>(pkg: string, service?: string) {
    return (constructor: T) => {
        const target = constructor.prototype;
        const serviceMethods: Record<string, Function> = {};
        Reflect.getMetadataKeys(target).forEach((key) => {
            const { name, method } = Reflect.getMetadata(key, target);
            serviceMethods[name] = method;
        });
        const name = service || getRpcName(constructor.name);
        // Register gRPC handlers
        server.addService(getProtoServiceName(pkg, name), serviceMethods);
    };
}

/**
 * gRPC 单参数请求服务处理方法装饰器
 */
export function grpcUnaryMethod<T, R>() {
    return (
        target: any,
        key: string,
        descriptor: PropertyDescriptor
    ) => {
        const method: GrpcHandler<T, R> = descriptor.value;
        const run: handleUnaryCall<T, R> = (call, callback) => {
            method.apply(null, [call.request, callback]);
        };
        messageHandler(run)(target, key, descriptor);
    };
}

/**
 * gRPC 流式请求服务处理方法装饰器
 */
export function grcpStreamingMethod<T, R>() {
    return (
        target: any,
        key: string,
        descriptor: PropertyDescriptor
    ) => {
        const method: GrpcHandler<T, R> = descriptor.value;
        const run: handleServerStreamingCall<T, R> = (call) => {
            method.apply(null, [call.request, call]);
        };
        messageHandler(run)(target, key, descriptor);
    };
}
