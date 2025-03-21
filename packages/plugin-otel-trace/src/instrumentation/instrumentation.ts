import {
    InstrumentationBase,
    InstrumentationNodeModuleDefinition,
    isWrapped
} from '@opentelemetry/instrumentation';
import type { InstrumentationModuleDefinition } from '@opentelemetry/instrumentation';

import type { INStarterInstrumentationConfig } from '../types';

import { getAsyncSpanFunctionWrap, getSpanFunctionWrap } from '../utils';
import { pkg } from '../pkg';

const DEFAULT_CONFIG: INStarterInstrumentationConfig = {
    traceCallback: false
};

/**
 * NStarter OpenTelemetry 观测
 *
 * 封装规范参考
 * @see https://github.com/open-telemetry/opentelemetry-js-contrib/blob/main/GUIDELINES.md
 * @experimental
 */
export class NStarterInstrumentation extends InstrumentationBase<INStarterInstrumentationConfig> {
    constructor(config: INStarterInstrumentationConfig) {
        super(pkg.name, pkg.version, { ...DEFAULT_CONFIG, ...config });
    }

    protected init(): InstrumentationModuleDefinition[] {
        return [
            new InstrumentationNodeModuleDefinition(
                'nstarter-core',
                ['>=1.2.0', '<2.0.0'],
                (module, moduleVersion) => {
                    const moduleExports =
                        module[Symbol.toStringTag] === 'Module'
                            ? module.default // ESM
                            : module; // CommonJS

                    if (isWrapped(moduleExports.registerSvc)) {
                        this._unwrap(moduleExports, 'registerSvc');
                    }
                    // @note
                    // 注意:
                    // - 必须是 `{ configurable: true }` 的属性才允许被注入
                    // - `module.exports` 默认 `{ configurable: false }` 无法被 patch
                    this._wrap(
                        moduleExports,
                        'registerSvc',
                        this._patchRegisterSvc(moduleVersion)
                    );
                    return module;
                },
                (module) => {
                    if (module === undefined) {
                        return;
                    }
                    const moduleExports =
                        module[Symbol.toStringTag] === 'Module'
                            ? module.default // ESM
                            : module; // CommonJS
                    this._unwrap(moduleExports, 'registerSvc');
                }
            )
        ];
    }

    /**
     * service 注册方法包装
     * @param moduleVersion
     * @private
     */
    private _patchRegisterSvc(moduleVersion?: string) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const instrumentation = this;
        // registerSvc
        return (original: Function)=> {
            return function(this: any, target: Constructor){
                // 原始 Service 注册行为 registerSvc
                original.call(this, target);
                // 跟踪类方法
                for (const name of Object.getOwnPropertyNames(target.prototype)) {
                    const scope = `${ target.name }::${ name }`;
                    // Service 属性检查
                    const descriptor = Object.getOwnPropertyDescriptor(target.prototype, name);
                    if (descriptor && descriptor.get && descriptor.set) {
                        // 跳过 LazyInject 注入
                        continue;
                    } else if (typeof target.prototype[name] !== 'function') {
                        // 跳过成员属性
                        continue;
                    }
                    // 包装成员方法
                    instrumentation._wrap(
                        target.prototype,
                        name,
                        instrumentation._patchSvcFunction(scope, moduleVersion)
                    );
                }
            };
        };
    }

    /**
     * 观测 service 方法执行
     * @param scope
     * @param moduleVersion
     * @private
     */
    private _patchSvcFunction(scope: string, moduleVersion?: string) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const instrumentation = this;
        const config = instrumentation.getConfig();
        return (original: any)=> {
            if (original[Symbol.toStringTag] === 'AsyncFunction') {
                // AsyncFunction
                return getAsyncSpanFunctionWrap(original, instrumentation.tracer, scope, {
                    onSpanStart: config.onSpanStart
                });
            } else {
                return getSpanFunctionWrap(original, instrumentation.tracer, scope, {
                    traceCallback: config.traceCallback,
                    onSpanStart: config.onSpanStart
                });
            }
        };
    }
}
