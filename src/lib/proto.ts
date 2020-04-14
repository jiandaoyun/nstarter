import _ from 'lodash';
import grpc, { Client } from 'grpc';
import { load } from '@grpc/proto-loader';
import { IPackageLoadOptions } from '../types';
import { DEFAULT_PKG } from '../constants';

export const protoRegistry: Record<string, typeof Client> = {};

/**
 * 加载 protobuf 配置
 * @param options
 */
export const loadProtoPackage = async (options: IPackageLoadOptions) => {
    const o = {
        protoPath: '',
        package: DEFAULT_PKG,
        ...options,
        loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
            ...options.loader
        }
    };
    const pack = await load(o.protoPath, o.loader);
    protoRegistry[o.package] = grpc.loadPackageDefinition(pack)[o.package] as typeof Client;
};

export const getProtoServiceClient = (pkg: string, service: string) =>
    _.get(protoRegistry, [pkg, service]);

export const getProtoServiceName = (pkg: string, service: string) =>
    _.get(protoRegistry, [pkg, service, 'service']);
