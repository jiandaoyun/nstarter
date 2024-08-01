import { handleServerStreamingCall, handleUnaryCall, Metadata, UntypedHandleCall } from '@grpc/grpc-js';
import { HandleCall } from '@grpc/grpc-js/build/src/server-call';
import _ from 'lodash';
import 'reflect-metadata';
import { DEFAULT_PKG, METHOD_PREFIX } from '../constants';
import { server } from '../lib';
import { getProtoServiceName } from '../lib/proto';
import { GrpcHandler } from '../types';
import { getRpcName, upperFirst } from '../utils';

/**
 * @param run - rpc 调用执行方法
 */
function messageHandler<T, R>(run: HandleCall<T, R>) {
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
 * @param pkg - gRPC 服务包名称
 * @param service - gRPC 服务名称
 */
export function grpcService<T extends Function>(pkg?: string, service?: string) {
    return (constructor: T) => {
        const rpcPkg = pkg || DEFAULT_PKG;
        const target = constructor.prototype;
        const serviceMethods: Record<string, UntypedHandleCall> = {};
        Reflect.getMetadataKeys(target).forEach((key) => {
            const { name, method } = Reflect.getMetadata(key, target);
            serviceMethods[name] = method;
        });
        const name = service || getRpcName(constructor.name);
        // Register gRPC handlers
        server.addService(getProtoServiceName(rpcPkg, name), serviceMethods);
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
            method.apply(null, [call.request])
                .then(
                    (unaryData: R) => callback(null, unaryData),
                    (err: Error & { code?: number }) => {
                        if (err.code) {
                            // 错误信息序列化
                            const meta = new Metadata();
                            meta.set('errcode', `${ err.code }`);
                            callback(err, null, meta);
                        } else {
                            callback(err, null);
                        }
                    }
                );
        };
        messageHandler(run)(target, key, descriptor);
    };
}

/**
 * gRPC 流式请求服务处理方法装饰器
 */
export function grpcStreamingMethod<T, R>() {
    return (
        target: any,
        key: string,
        descriptor: PropertyDescriptor
    ) => {
        const method: GrpcHandler<T, R> = descriptor.value;
        const run: handleServerStreamingCall<T, R> = (call) => {
            const oriFunc = call.emit;
            call.emit = function emit(event: string | symbol, ...args: any[]) {
                if (event === 'error' && _.get(args, ['0', 'code'])) {
                    // 错误信息序列化
                    const err: Error & { code?: number } | undefined = args[0];
                    if (err?.code) {
                        const metadata = new Metadata();
                        metadata.set('errcode', `${ _.get(args, ['0', 'code']) }`);
                        _.extend(err, {
                            metadata
                        });
                        return oriFunc.apply(this, [event, err]);
                    }
                } else {
                    // 正常执行
                    return oriFunc.apply(this, [event, ...args]);
                }
            };
            method.apply(null, [call.request, call]);
        };
        messageHandler(run)(target, key, descriptor);
    };
}
