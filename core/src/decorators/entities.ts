import 'reflect-metadata';
import { entityMetaKey } from '../lib';

/**
 * entities 注入嵌套 properties 装饰器
 */
export function injectEntityProperty<T extends Constructor>() {
    return (constructor: T) => {
        Reflect.defineMetadata(entityMetaKey, {
            properties: new constructor().properties
        }, constructor);
    };
}

