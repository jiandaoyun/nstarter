import type { Client} from '@grpc/grpc-js';
import { credentials } from '@grpc/grpc-js';
import https, { Agent } from 'https';
import type { TLSSocket } from 'tls';
import type { IClientConfig } from '../types';
import { getProtoServiceClient } from './proto';
import { DEFAULT_CHANNEL_OPTION } from '../constants';

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
export const getGrpcServiceClient = async (pkg: string, service: string): Promise<Client> => {
    const GrpcClient = getProtoServiceClient(pkg, service);
    const clientConfig = clientRegistry.get(pkg);
    if (GrpcClient && clientConfig) {
        // 使用ssl
        if (clientConfig.useSsl) {
            // 泛域名证书
            if (clientConfig.servername) {
                const buffer = await getCertificateBuffer(clientConfig.address, clientConfig.servername!);
                return new GrpcClient(clientConfig.address, credentials.createSsl(buffer), {
                    ...DEFAULT_CHANNEL_OPTION,
                    'grpc.ssl_target_name_override': clientConfig.servername!
                });
            } else {
                return new GrpcClient(clientConfig.address, credentials.createSsl(), {
                    ...DEFAULT_CHANNEL_OPTION
                });
            }
        } else {
            return new GrpcClient(clientConfig.address, credentials.createInsecure(), {
                ...DEFAULT_CHANNEL_OPTION
            });
        }
    } else {
        // 客户端未定义
        throw new Error(`Grpc client '${ pkg }.${ service }' not found.`);
    }
};

const getCertificateBuffer = async (address: string, servername: string): Promise<Buffer> => {
    const agent = new Agent({
        requestCert: true,
        rejectUnauthorized: false,
        servername
    });
    return new Promise((onResolve, onReject) => {
        const req = https.get('https://' + address,
            {
                protocol: 'https:',
                agent,
                method: 'GET'
            },
            res => {
                const socket = res.socket as TLSSocket;
                // 获取格式化之后的证书内容
                const certString = pemEncode(socket.getPeerCertificate().raw.toString('base64'), 64);
                return onResolve(Buffer.from(certString));
            }
        );
        req.on('error', err => {
            return onReject(err);
        });
    });

};

const pemEncode = (str: string, n: number) => {
    const ret = [];

    for (let i = 1; i <= str.length; i++) {
        ret.push(str[i - 1]);
        const mod = i % n;
        if (mod === 0) {
            ret.push('\n');
        }
    }

    return `-----BEGIN CERTIFICATE-----\n${ ret.join('') }\n-----END CERTIFICATE-----`;
};
