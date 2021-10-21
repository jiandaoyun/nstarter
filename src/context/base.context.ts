import { Request } from 'express';

/**
 * 上下文对象基类
 */
export class BaseContext {
    // 跟踪 Id
    public traceId: string;

    /**
     * 根据请求初始化上下文
     * @param req - 请求对象
     */
    public setByRequest(req: Request) {
        // 使用请求 Id 跟踪上下文
        this.traceId = req.requestId;
    }
}
