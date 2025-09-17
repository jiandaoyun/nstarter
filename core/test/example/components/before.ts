import { ContextProvider, Logger } from '../../../src';
import { Context } from '../context';
import { defaultTransports } from './lib/logger';

export const beforeLoad = () => {
    // 初始化上下文
    ContextProvider.initialize(Context);

    // 注册日志meta key白名单.
    Logger.registerMetaKeyWhitelist(Object.values({
        KEY: 'key'
    }));

    // 初始化日志记录
    for (const transport of defaultTransports) {
        Logger.registerTransport(transport);
    }
};
