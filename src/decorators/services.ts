import getDecorators from 'inversify-inject-decorators';
import { serviceContainer, serviceMetaKey } from '../lib';

const { lazyInject } = getDecorators(serviceContainer);

/**
 * 服务定义装饰器
 * @param identifier
 */
export function Service<T extends Constructor>(identifier?: string | symbol) {
    return (constructor: T) => {
        let id = identifier;
        if (!id) {
            id = constructor.name.toLowerCase();
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
export function InjectService(identifier?: string | symbol) {
    return function (target: any, key: string) {
        let id = identifier;
        if (!id) {
            id = key.toLowerCase();
        }
        return lazyInject(id)(target, key);
    };
}
