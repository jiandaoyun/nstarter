import type { ContextItem } from './types';
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
     * 设置上下文跟踪 id
     * @param traceId - 上下文跟踪 id
     */
    public setTraceId(traceId: string) {
        this.traceId = traceId;
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
