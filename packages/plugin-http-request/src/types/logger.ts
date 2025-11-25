/**
 * 日志相关类型定义
 */

/**
 * 日志记录器接口
 */
export interface ILogger {
    debug: (message: string, meta?: Record<string, any>) => void;
    info: (message: string, meta?: Record<string, any>) => void;
    warn: (message: string, meta?: Record<string, any>) => void;
    error: (message: string, meta?: Record<string, any>) => void;
}

/**
 * 请求失败选项
 */
export interface IResFailedOptions {
    isSuccess: boolean;
    timestamp: number;
}

/**
 * 请求成功选项
 */
export interface IResSuccessOptions {
    isSuccess: boolean;
    timestamp: number;
}

/**
 * HTTP 客户端日志记录器
 */
export interface IHttpClientLogger {
    logFailed: (
        resOptions: Omit<IResFailedOptions, 'isSuccess' | 'timestamp'>
    ) => void;

    logSuccess: (
        resOptions: Omit<IResSuccessOptions, 'isSuccess' | 'timestamp'>
    ) => void;
}

