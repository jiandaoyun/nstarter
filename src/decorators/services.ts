import _ from 'lodash';
import getDecorators from 'inversify-inject-decorators';
import { serviceContainer, serviceMetaKey } from '../lib';

const { lazyInject } = getDecorators(serviceContainer);

/**
 * 服务定义装饰器
 * @param identifier
 */
export function provideSvc<T extends Constructor>(identifier?: string | symbol) {
    return (constructor: T) => {
        let id = identifier;
        if (!id) {
            id = _.camelCase(constructor.name);
        }
        Reflect.defineMetadata(serviceMetaKey, {
            id,
            originName: constructor.name,
        }, constructor);
    };
}

/**
 * 服务对象引用注入装饰器
 * @param identifier
 */
export function injectSvc(identifier?: string | symbol) {
    return function (target: any, key: string) {
        let id = identifier;
        if (!id) {
            id = _.camelCase(key);
        }
        return lazyInject(id)(target, key);
    };
}
