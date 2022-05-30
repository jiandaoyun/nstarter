import chai from 'chai';
import { ConfigLoader, ConfigLoadEvents } from '../src';
import { DemoConfig } from './lib/demo.config';
import { ErrorConfig } from './lib/error.config';

const expect = chai.expect;

describe('ConfigLoader Test', () => {
    it('load', async () => {
        const loader = new ConfigLoader(DemoConfig, {
            files: ['./test/conf.d/config.base']
        }).initialize();
        const config = loader.getConfig();
        expect(config.system?.locale).to.equal('en_us');
    });

    it('load with include', async () => {
        const loader = new ConfigLoader(DemoConfig, {
            files: ['./test/conf.d/config.base'],
            useIncludes: true
        }).initialize();
        const config = loader.getConfig();
        expect(config.system?.locale).to.equal('zh_cn');
    });

    it('load with hot-reload', async () => {
        const loader = new ConfigLoader(DemoConfig, {
            files: ['./test/conf.d/config.base'],
            useHotReload: true
        }).initialize();
        const config = loader.getConfig();
        expect(config.system?.locale).to.equal('en_us');
    });

    it('load error', (done) => {
        const loader = new ConfigLoader(ErrorConfig, {
            files: ['./test/conf.d/config.base']
        });
        loader.on(ConfigLoadEvents.init_failed, (err: Error) => {
            expect(err).to.exist;
            return done();
        });
        loader.initialize();
    });
});
