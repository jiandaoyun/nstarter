/**
 * Copyright (c) 2015-2021, FineX, All Rights Reserved.
 * @author vista
 * @date  2020/07/08
 */

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
    controllerContainer.bind(identifier.id).to(injectable()(target));
};

/**
 * 服务对象实例的获取方法
 * @param target - 被注册服务的构造函数
 */
export const getCtl: PropertyDecorator = <T>(target: Constructor<T>): T => {
    const meta = Reflect.getMetadata(controllerMetaKey, target);
    return controllerContainer.get<T>(meta.id);
};
