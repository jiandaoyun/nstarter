import { NextFunction, Request, RequestHandler, Response } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

import { BaseContext } from './base.context';


/**
 * 上下文管理器
 */
export class ContextProvider<T extends BaseContext> {
    private static _instance: ContextProvider<any>;

    private readonly _localStorage = new AsyncLocalStorage<T>();
    private readonly _Context: Constructor<T>;

    private constructor(Context: Constructor<T>) {
        this._Context = Context;
    }

    /**
     * 生成上下文生成中间件
     */
    private get middleware(): RequestHandler {
        return (req: Request, res: Response, next: NextFunction) =>
            this._localStorage.run(new this._Context(), () => {
                const context = this.context;
                if (context) {
                    context.setByRequest(req);
                }
                return next();
            });
    }

    /**
     * 获取上下文对象
     */
    private get context(): T | undefined {
        return this._localStorage.getStore();
    }

    /**
     *
     * @private
     */
    private startContext() {
        return this._localStorage.enterWith(new this._Context());
    }

    /**
     * 生成单例
     * @private
     */
    private static getInstance<T extends BaseContext>(): ContextProvider<T> {
        const instance = ContextProvider._instance;
        if (!instance) {
            throw new Error('Context provider has not been initialized.');
        } else {
            return instance;
        }
    }

    /**
     * 初始化
     * @param Context
     */
    public static initialize<T extends BaseContext>(Context: Constructor<T>) {
        ContextProvider._instance = new ContextProvider(Context);
    }

    /**
     * 获取上下文请求处理中间件
     */
    public static getMiddleware<T extends BaseContext>(): RequestHandler {
        return ContextProvider.getInstance<T>().middleware;
    }

    /**
     * 初始化并进入上下文
     *
     * @note 用于非请求类上下文场景初始化。存在同步逻辑下污染的局限性，避免在静态/全局方法中使用。
     * @see https://nodejs.org/api/async_context.html#asynclocalstorageenterwithstore
     */
    public static startContext<T extends BaseContext>(): void {
        ContextProvider.getInstance<T>().startContext();
    }

    /**
     * 获取上下文对象
     */
    public static getContext<T extends BaseContext>(): T | undefined {
        return ContextProvider.getInstance<T>().context;
    }
}
