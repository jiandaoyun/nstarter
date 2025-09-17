import { ContextProvider, controller } from '../../../src';
import { Errors } from '../errors';
import { demoController } from './index';

@controller()
export class DemoController {
    /**
     * POST 请求 & 上下文跟踪示例
     */
    public async doPing() {
        const context = ContextProvider.getContext();
        context.setTraceId('test_context')
        return {
            'msg': 'pong',
            'traceId': context?.traceId
        };
    }

    /**
     * 错误页面示例
     */
    public async goErrorView() {
        throw Errors.test(1001);
    };
}
