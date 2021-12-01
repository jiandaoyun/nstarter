import { Request } from 'express';
import { ContextItem } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * 上下文对象基类
 */
export class BaseContext {
    // 跟踪 Id
    public traceId: string;

    /**
     * @param context - 上下文初始内容
     */
    constructor(context?: ContextItem) {
        this.traceId = uuidv4();
        // 基于初始值初始化
        if (context) {
            this.fromJSON(context);
        }
    }


    /**
     * 根据请求初始化上下文
     * @param req - 请求对象
     */
    public setByRequest(req: Request) {
        // 使用请求 Id 跟踪上下文
        this.traceId = req.requestId;
    }

    /**
     * 上下文对象转 JSON
     */
    public toJSON(): ContextItem {
        return {
            traceId: this.traceId
        };
    }

    /**
     * 根据上下文内容配置上下文对象
     * @param context - 上下文 JSON 内容
     */
    public fromJSON(context: ContextItem) {
        this.traceId = context.traceId || uuidv4();
    }
}
