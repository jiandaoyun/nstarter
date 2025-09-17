import type { ErrorBuilder } from '../../../src';
import { NsError, registerErrorMessages } from '../../../src';
import { ErrorTypes, errorMessages } from './err_msgs';

registerErrorMessages(errorMessages);

const errors = {} as any as Record<keyof typeof ErrorTypes, ErrorBuilder>;

type ErrorTypeKeys = keyof typeof ErrorTypes;

// 注册错误生成工厂方法
(Object.keys(ErrorTypes) as ErrorTypeKeys[]).forEach(errorType => {
    errors[errorType] = (...args) => new NsError(ErrorTypes[errorType], ...args) as Error;
})

export {
    errors as Errors
};
