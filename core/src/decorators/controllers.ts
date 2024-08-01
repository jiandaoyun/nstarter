/**
 * Copyright (c) 2015-2021, FineX, All Rights Reserved.
 * @author vista
 * @date  2020/07/08
 */

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
