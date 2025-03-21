import { Container, injectable } from 'inversify';
import 'reflect-metadata';
import type { IServiceMeta } from './types';

/**
 * 默认服务注册作用域
 */
export const defaultSvcScope = Symbol.for('default');

/**
 * 服务元数据绑定标识
 */
export const serviceMetaKey = Symbol.for('ioc#service');

/**
 * 默认全局服务注册容
 */
const defaultSvcContainer = new Container({
    defaultScope: 'Singleton',
    autoBindInjectable: false
});

/**
 * 划分作用域的服务容器
 */
const svcContainerMap: {
    [scope: string | symbol]: Container
} = {
    [defaultSvcScope]: defaultSvcContainer
};

/**
 * 服务注册域获取方法
 * @param scope - 服务注册域，不指定则使用默认全局域
 */
export const getSvcScope = (scope?: string | symbol) => {
    return scope || defaultSvcScope;
};

/**
 * 获取指定作用域下的服务注册容器
 * @param scope - 服务注册域，不指定则使用默认全局域
 */
export const getSvcContainer = (scope?: string | symbol) => {
    const svcScope = getSvcScope(scope);
    let svcContainer = svcContainerMap[svcScope];
    if (!svcContainer && scope !== defaultSvcScope) {
        // 创建新的服务注册容器
        svcContainer = new Container({
            defaultScope: 'Singleton',
            autoBindInjectable: false
        });
        svcContainerMap[svcScope] = svcContainer;
    }
    return svcContainer;
};

/**
 * 服务对象注册方法
 * @param target - 被注册服务的构造函数
 */
const registerSvc = (target: Constructor) => {
    const identifier: IServiceMeta = Reflect.getMetadata(serviceMetaKey, target);
    const serviceContainer = getSvcContainer(identifier.scope);
    serviceContainer.bind(identifier.id).to(injectable()(target));
};
export { registerSvc };
// @note 允许被 patch 注入，用于跟踪等场景
Object.defineProperty(exports, 'registerSvc', {
    enumerable: true,
    configurable: true,
    get () {
        return registerSvc;
    }
});


/**
 * 服务对象实例的获取方法
 * @param target
 */
export const getSvc = <T>(target: Constructor<T>): T =>  {
    const identifier: IServiceMeta = Reflect.getMetadata(serviceMetaKey, target);
    const serviceContainer = getSvcContainer(identifier.scope);
    return serviceContainer.get<T>(identifier.id);
};
