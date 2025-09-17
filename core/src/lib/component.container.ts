import { bindingScopeValues, Container } from 'inversify';
import 'reflect-metadata';

export const componentContainer = new Container({
    defaultScope: bindingScopeValues.Singleton
});

export const componentMetaKey = Symbol.for('ioc#component');

/**
 * 组件对象注册工具方法
 * @param target - 被注册服务的构造函数
 */
export function registerComponent(target: Constructor) {
    const { id, scope } = Reflect.getMetadata(componentMetaKey, target);
    switch (scope) {
        case bindingScopeValues.Request:
            componentContainer
                .bind(id)
                .to(target)
                .inRequestScope();
            break;
        case bindingScopeValues.Singleton:
            // 单例
            componentContainer
                .bind(id)
                .to(target)
                .inSingletonScope();
            break;
        case bindingScopeValues.Transient:
            componentContainer
                .bind(id)
                .to(target)
                .inTransientScope();
            break;
        default:
            // 使用 componentContainer 初始化时候的 scope，默认：Singleton
            componentContainer
                .bind(id)
                .to(target);
            break;
    }
}

/**
 * 组件对象实例的获取方法
 * @param target
 */
export function getComponent<T>(target: Constructor<T>): T {
    const identifier = Reflect.getMetadata(componentMetaKey, target);
    return componentContainer.get<T>(identifier.id);
}
