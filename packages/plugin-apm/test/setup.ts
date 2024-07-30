import apmAgent from 'elastic-apm-node';

import { apmConnector } from '../src';
import { sleep } from './functions';

exports.mochaHooks = {
    async beforeAll() {
        const apm = apmAgent.start({
            serviceName: 'nstarter-apm',
            captureBody: 'transactions',
            captureHeaders: true,
            transactionSampleRate: 1,
            transactionMaxSpans: 100,
            apiRequestTime: '100ms',
            active: true
        });

        apmConnector.setApmAgent(apm);
        await sleep(200);
        if (apmConnector.apm) {
            console.log(`ApmStarted: ${ apmConnector.apm.isStarted() }`);
        }
    }
};
