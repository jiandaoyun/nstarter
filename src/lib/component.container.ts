import { Container, injectable } from 'inversify';
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
    const identifier = Reflect.getMetadata(componentMetaKey, target);
    componentContainer.bind(identifier.id).to(injectable()(target));
}

/**
 * 组件对象实例的获取方法
 * @param target
 */
export function getComponent<T>(target: Constructor<T>): T {
    const identifier = Reflect.getMetadata(componentMetaKey, target);
    return componentContainer.get<T>(identifier.id);
}
