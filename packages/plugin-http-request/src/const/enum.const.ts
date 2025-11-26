/**
 * HTTP请求客户端适配器枚举.
 */
export enum EClientAdapter {
    'axios' = 'axios',
    'undici' = 'undici',
}

/**
 * 日志级别
 */
export enum ELogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error'
}
