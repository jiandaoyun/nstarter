import { Container, injectable } from 'inversify';
import 'reflect-metadata';

export const serviceContainer = new Container({
    defaultScope: 'Singleton',
    autoBindInjectable: false
});

export const serviceMetaKey = 'ioc:service';

/**
 * 服务对象注册方法
 * @param target - 被注册服务的构造函数
 */
export const registerSvc = (target: Constructor) => {
    const identifier = Reflect.getMetadata(serviceMetaKey, target);
    serviceContainer.bind(identifier.id).to(injectable()(target));
};

/**
 * 服务对象实例的获取方法
 * @param target
 */
export const getSvc = <T>(target: Constructor<T>): T =>  {
    const identifier = Reflect.getMetadata(serviceMetaKey, target);
    return serviceContainer.get<T>(identifier.id);
};
