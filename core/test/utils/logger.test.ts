import chai from 'chai';

import { Logger } from '../../src';

const should = chai.should();

describe('utils', () => {
    it('debug', () => {
        Logger.debug('debug');
    });

    it('info', () => {
        Logger.info('info', {
            key: 'key',
            invalid: 'invalid'
        });
    });

    it('warn', () => {
        Logger.warn('warn');
    });

    it('error', () => {
        Logger.error('error');
    });

    it('multiple register', () => {
        try {
            Logger.registerMetaKeyWhitelist(Object.values({
                EXTRA: 'extra'
            }));
        } catch (err) {
            should.exist(err);
        }
    });
});
