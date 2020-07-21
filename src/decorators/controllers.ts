/**
 * Copyright (c) 2015-2021, FineX, All Rights Reserved.
 * @author vista
 * @date  2020/07/08
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import getDecorators from 'inversify-inject-decorators';
import { controllerContainer, controllerMetaKey } from '../lib';

const { lazyInject } = getDecorators(controllerContainer);

/**
 * controller 类装饰器
 * @param id - 标识符
 */
export const controller: (
    id?: string | symbol
) => ClassDecorator =
    (id) => (constructor) => {
        const constructorName = constructor.name;
        const idOrLowerConstructorName = id ?? constructorName.toLowerCase();
        Reflect.defineMetadata(controllerMetaKey, {
            id: idOrLowerConstructorName,
            originName: constructorName
        }, constructor);
    };

/**
 * controller 注入属性装饰器
 * @param id - 标识符
 * @deprecated 代码中 controller 不应彼此依赖
 */
export const injectController: (
    id?: string | symbol
) => PropertyDecorator =
    (id) => (target, propertyKey) => {
        const stringifyPropertyKey = propertyKey.toString();
        const idOrLowerPropertyKey = id ?? stringifyPropertyKey.toLowerCase();
        return lazyInject(idOrLowerPropertyKey)(target, stringifyPropertyKey);
    };

/**
 * 异步 controller 实例方法装饰器
 * @desc 保证异步 controller 方法中抛出的错误可以正常进入 Express Middleware Chain 中
 */
export const asyncControllerMethod = (
    target: unknown,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<RequestHandler>
) => {
    const { value } = descriptor;
    if (value) {
        descriptor.value = (
            req: Request,
            res: Response,
            next: NextFunction
        ) => {
            let n = 1;
            const nextOnlyNTimes = (...args: unknown[]) => {
                if (0 < n--) {
                    next(...args);
                }
            };
            Promise
                .resolve(value(req, res, nextOnlyNTimes))
                .catch(nextOnlyNTimes);
        };
    }
};
