import { interfaces } from 'inversify';
import getDecorators from 'inversify-inject-decorators';
import { componentContainer, componentMetaKey } from '../lib';
import BindingScope = interfaces.BindingScope;

const { lazyInject } = getDecorators(componentContainer);

/**
 * 组件定义装饰器
 * @param identifier
 * @param scope
 */
export function provideComponent<T extends Constructor>(
    scope?: BindingScope,
    identifier?: string
) {
    return (constructor: T) => {
        let id = identifier,
            name = identifier;
        if (!id) {
            id = constructor.name;
            name = id;
        }
        constructor.prototype._name = name;
        Reflect.defineMetadata(componentMetaKey, {
            id,
            originName: constructor.name,
            scope
        }, constructor);
    };
}

/**
 * 组件对象引用注入装饰器
 * @param identifier
 */
export function injectComponent(identifier?: string | symbol) {
    return function (target: any, key: string) {
        let id = identifier;
        if (!id) {
            id = key;
        }
        return lazyInject(id)(target, key);
    };
}
