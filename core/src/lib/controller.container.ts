/**
 * Copyright (c) 2015-2021, FineX, All Rights Reserved.
 * @author vista
 * @date  2020/07/08
 */

import type { NextFunction, Request, Response } from 'express';
import { Container, injectable } from 'inversify';
import 'reflect-metadata';

export const controllerContainer = new Container({
    defaultScope: 'Singleton',
    autoBindInjectable: false
});

export const controllerMetaKey = Symbol.for('ioc#controller');

/**
 * 服务对象注册方法
 * @param target - 被注册服务的构造函数
 */
export const registerCtl = (target: Constructor) => {
    const identifier = Reflect.getMetadata(controllerMetaKey, target);
    controllerContainer
        .bind(identifier.id)
        .to(injectable()(target))
        .onActivation((context, target: object) => {
            return new Proxy(target, {
                get(
                    target: Function,
                    propertyKey: PropertyKey,
                    receiver: unknown
                ): Function {
                    const value = Reflect.get(target, propertyKey, receiver);
                    if (value) {
                        return (
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
                    } else {
                        return value;
                    }
                }
            });
        });
};

/**
 * 服务对象实例的获取方法
 * @param target - 被注册服务的构造函数
 */
export const getCtl = <T>(target: Constructor<T>): T => {
    const meta = Reflect.getMetadata(controllerMetaKey, target);
    return controllerContainer.get<T>(meta.id);
};
