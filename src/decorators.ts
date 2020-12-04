import 'reflect-metadata';
import { metaKey } from './enums';

/**
 * 递归属装饰器生成方法
 * @itemCtor - 子属性实体类型，可选参数
 */
export const entityAttr = (itemCtor?: Constructor): PropertyDecorator =>
    (target, key) => {
        const ctor = Reflect.getMetadata('design:type', target, key);
        Reflect.defineMetadata(metaKey.constructor, ctor, target, key);
        if ((ctor === Array || ctor === Object) && itemCtor) {
            Reflect.defineMetadata(metaKey.itemConstructor, itemCtor, target, key);
        }
    };
