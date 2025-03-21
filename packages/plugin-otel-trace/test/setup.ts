import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { TraceSDK, NStarterInstrumentation } from '../src';

exports.mochaHooks = {
    async beforeAll() {
        console.log('startup trace');
        // 跟踪配置
        const trace = new TraceSDK({
            traceExporter: new ConsoleSpanExporter(),
            instrumentations: [
                new NStarterInstrumentation({
                    traceCallback: true,
                    onSpanStart: (span) => {
                        console.log(span);
                    }
                })
            ],
        });

        // 启动跟踪观测
        trace.start();
    }
};
