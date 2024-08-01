export const CLIENT_META = 'grpc:client';
export const METHOD_PREFIX = 'grpc:method:';

export const DEFAULT_PKG = 'default';

/**
 * 默认的 gRPC 通道配置
 * @see https://github.com/grpc/grpc/blob/2d4f3c56001cd1e1f85734b2f7c5ce5f2797c38a/doc/keepalive.md 保活机制
 * @see https://github.com/grpc/grpc-node/issues/2340 相关issue
 */
export const DEFAULT_CHANNEL_OPTION = {
    'grpc.keepalive_time_ms': 40000,                    // send keepalive packet every 40 second, Set to twice the value of timeout.
    'grpc.keepalive_timeout_ms': 20000,                  // keepalive ping time out after 20 second, The official default is 20s. Keep it here.
    'grpc.keepalive_permit_without_calls': 1,           // allow keepalive pings when there's no gRPC calls
};

