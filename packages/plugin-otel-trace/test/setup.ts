import { TraceSDK, NStarterInstrumentation } from '../src';

import { Hook } from 'require-in-the-middle';

const instrumentation = new NStarterInstrumentation({
    traceCallback: true,
    onSpanStart: (span) => {
        console.log(`  span -> ${ span.name }`);
    }
});

// 使用 require-in-the-middle 拦截 nstarter-core 模块
// 默认行为不支持 npm workspace 中非 node_modules 下的软连接路径模块装载
new Hook([require.resolve('nstarter-core')], {}, (exports, name, moduleDir) => {
    console.log(`Intercepted workspace module`);
    const moduleDefinition = instrumentation.getModuleDefinitions()[0];
    return moduleDefinition.patch(exports, moduleDefinition.moduleVersion);
});

// 跟踪配置
const trace = new TraceSDK({
    instrumentations: [
        instrumentation
    ],
});

exports.mochaHooks = {
    async beforeAll() {
        console.log('startup trace');

        // 启动跟踪观测
        trace.start();
    }
};
