import { BindingScopeEnum, Container, injectable } from 'inversify';
import 'reflect-metadata';

export const componentContainer = new Container({
    defaultScope: 'Singleton',
    autoBindInjectable: false
});

export const componentMetaKey = 'ioc:component';

/**
 * 组件对象注册工具方法
 * @param target - 被注册服务的构造函数
 */
export function registerComponent(target: Constructor) {
    const { id, scope } = Reflect.getMetadata(componentMetaKey, target);
    switch (scope) {
        case BindingScopeEnum.Request:
            componentContainer.bind(id).to(injectable()(target)).inRequestScope();
            break;
        case BindingScopeEnum.Singleton:
            // 单例
            componentContainer.bind(id).to(injectable()(target)).inSingletonScope();
            break;
        case BindingScopeEnum.Transient:
            componentContainer.bind(id).to(injectable()(target)).inTransientScope();
            break;
        default:
            // 使用 componentContainer 初始化时候的 scope，默认：Singleton
            componentContainer.bind(id).to(injectable()(target));
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
