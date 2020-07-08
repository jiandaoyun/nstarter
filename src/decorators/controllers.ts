/**
 * Copyright (c) 2015-2021, FineX, All Rights Reserved.
 * @author vista
 * @date  2020/07/08
 */

import { RequestHandler } from 'express';
import getDecorators from 'inversify-inject-decorators';
import { controllerContainer, controllerMetaKey } from '../lib';

const { lazyInject } = getDecorators(controllerContainer);

/**
 * Controller 类装饰器
 * @param id - 标识符
 */
export const provideCtl: (
    id?: string | symbol
) => ClassDecorator =
    (id) => {
        return (constructor) => {
            id = id ?? constructor.name.toLowerCase();
            Reflect.defineMetadata(controllerMetaKey, {
                id,
                originName: constructor.name
            }, constructor);
        };
    };

/**
 * Controller 注入属性装饰器
 * @param id - 标识符
 * @deprecated
 */
export const injectCtl: (
    id?: string | symbol
) => PropertyDecorator =
    (id) => {
        return (target, propertyKey) => {
            id = id ?? propertyKey.toString().toLowerCase();
            return lazyInject(id)(target, propertyKey);
        };
    };

/**
 * 异步 Controller 实例方法装饰器
 * @desc 保证异步 Controller 方法中抛出的错误可以正常进入 Express Middleware Chain 中
 */
export const asyncCtl: () => MethodDecorator = () => {
    return (target, propertyKey, descriptor: TypedPropertyDescriptor<RequestHandler>) => {
        const { value } = descriptor;
        descriptor.value = (req, res, next) => {
            let n = 1;
            const nextOnlyNTimes = (...args: unknown[]) => {
                if (0 < n--) next(...args);
            };
            Promise
                .resolve(value(req, res, nextOnlyNTimes))
                .catch(nextOnlyNTimes);
        };
    };
};
