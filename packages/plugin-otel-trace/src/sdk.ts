import { NodeSDK } from '@opentelemetry/sdk-node';
import type { NodeSDKConfiguration } from '@opentelemetry/sdk-node';

export type TraceSDKConfiguration = Pick<
    NodeSDKConfiguration,
    'autoDetectResources' | 'contextManager' | 'textMapPropagator' |
    'instrumentations' | 'resource' | 'resourceDetectors' | 'sampler' |
    'serviceName' | 'spanProcessors' | 'traceExporter' | 'spanLimits' |
    'idGenerator'
>;

export class TraceSDK extends NodeSDK {
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    constructor(configuration?: Partial<TraceSDKConfiguration>) {
        super(configuration);
    }
}
