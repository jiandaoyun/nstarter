import 'reflect-metadata';

/**
 * entities meta key
 */
export const entityMetaKey = Symbol.for('ioc#entity');

/**
 * 从 entities 注入 meta 信息获取嵌套的 properties 属性
 */
export const getEntityProperty = <T, P>(target: Constructor<T>): P => {
    const identifier = Reflect.getMetadata(entityMetaKey, target);
    return identifier?.properties ?? {};
};
