import getDecorators from 'inversify-inject-decorators';
import { serviceMetaKey, getSvcContainer, IServiceMeta, defaultSvcScope } from '../lib';
import { camelCase } from '../utils';

/**
 * 服务注册装饰器生成方法
 * @param scope - 服务注册域
 */
export const getScopedServiceDecorators = (scope?: string | symbol) => {
    const svcContainer = getSvcContainer(scope);
    const { lazyInject } = getDecorators(svcContainer);
    return {
        /**
         * 服务定义装饰器
         * @param identifier - 服务注册标识，默认基于类名生成驼峰字符串标识
         */
        service<T extends Constructor>(identifier?: string | symbol) {
            return (constructor: T) => {
                let id = identifier;
                if (!id) {
                    id = camelCase(constructor.name);
                }
                const serviceMeta: IServiceMeta = {
                    id,
                    originName: constructor.name,
                    scope
                };
                Reflect.defineMetadata(serviceMetaKey, serviceMeta, constructor);
            };
        },
        /**
         * 装饰器方法
         * @param identifier - 服务注册标识，默认基于类名生成驼峰字符串标识
         */
        injectService(identifier?: string | symbol) {
            return function (target: any, key: string) {
                let id = identifier;
                if (!id) {
                    id = camelCase(key);
                }
                return lazyInject(id)(target, key);
            };
        },
    };
};

const {
    // 默认服务定义装饰器 (全局公共域)
    service,
    // 默认服务对象引用注入装饰器 (全局公共域)
    injectService,
} = getScopedServiceDecorators(defaultSvcScope);

export { service, injectService };
