/**
 * 日志相关类型定义
 */

import type {
    HttpRequestOptions,
    HttpResponse
} from './request_response';

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
    /** 是否成功 */
    isSuccess: false;
    /** 时间戳 */
    timestamp: number;
    /** 请求选项 */
    request: HttpRequestOptions;
    /** 错误信息 */
    error: Error;
    /** 错误码 */
    errorCode?: string;
    /** HTTP 状态码（如果有响应） */
    status?: number;
    /** 响应对象（如果有） */
    response?: HttpResponse;
    /** 请求耗时（毫秒） */
    duration?: number;
    /** 重试次数 */
    retryCount?: number;
}

/**
 * 请求成功选项
 */
export interface IResSuccessOptions {
    /** 是否成功 */
    isSuccess: true;
    /** 时间戳 */
    timestamp: number;
    /** 请求选项 */
    request: HttpRequestOptions;
    /** 响应对象 */
    response: HttpResponse;
    /** 请求耗时（毫秒） */
    duration: number;
    /** 重试次数 */
    retryCount?: number;
}

/**
 * 日志过滤器接口
 */
export interface ILogFilter {
    /**
     * 判断是否应该记录此日志
     * @param options 日志选项（成功或失败）
     * @returns 是否应该记录
     */
    shouldLog: (options: IResSuccessOptions | IResFailedOptions) => boolean;
}

/**
 * 日志过滤器配置
 */
export interface LogFilterConfig {
    /** 只记录特定 HTTP 方法 */
    methods?: string[];
    /** 只记录特定 URL 模式（支持正则表达式） */
    urlPatterns?: (string | RegExp)[];
    /** 只记录特定场景 */
    scenarios?: string[];
    /** 只记录特定状态码 */
    statusCodes?: number[];
    /** 只记录特定状态码范围 */
    statusCodeRanges?: Array<{ min: number, max: number }>;
    /** 只记录失败的请求 */
    onlyFailed?: boolean;
    /** 只记录成功的请求 */
    onlySuccess?: boolean;
    /** 只记录耗时超过指定毫秒数的请求 */
    minDuration?: number;
    /** 自定义过滤函数 */
    customFilter?: (options: IResSuccessOptions | IResFailedOptions) => boolean;
}

/**
 * HTTP 客户端日志记录器
 */
export interface IHttpClientLogger {
    /**
     * 记录失败的请求
     * @param resOptions 请求失败选项
     */
    logFailed: (
        resOptions: Omit<IResFailedOptions, 'isSuccess' | 'timestamp'>
    ) => void;

    /**
     * 记录成功的请求
     * @param resOptions 请求成功选项
     */
    logSuccess: (
        resOptions: Omit<IResSuccessOptions, 'isSuccess' | 'timestamp'>
    ) => void;
}


/**
 * HTTP 客户端日志记录器配置
 */
export interface HttpClientLoggerConfig {
    /** 底层日志记录器 */
    logger: ILogger;
    /** 日志过滤器（可选） */
    filter?: ILogFilter;
    /** 是否记录请求体 */
    logRequestBody?: boolean;
    /** 是否记录响应体 */
    logResponseBody?: boolean;
    /** 响应体最大记录长度（字节） */
    bodyMaxLength?: number;
}
