/**
 * 错误类型定义
 */

import type { HttpRequestOptions, HttpResponse } from './request_response';

/**
 * HTTP 错误
 */
export class HttpError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly status?: number,
        public readonly response?: HttpResponse,
        public readonly request?: HttpRequestOptions
    ) {
        super(message);
        this.name = 'HttpError';
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 安全验证错误
 */
export class SecurityError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly url?: string
    ) {
        super(message);
        this.name = 'SecurityError';
        Error.captureStackTrace(this, this.constructor);
    }
}

