import chai from 'chai';
import { ConfigLoader } from '../src';
import { DemoConfig } from './lib/demo.config';
import { ErrorConfig } from './lib/error.config';

const expect = chai.expect;

describe('ConfigLoader Test', () => {
    it('load', async () => {
        const config = new ConfigLoader<DemoConfig>(DemoConfig, {
            files: ['./test/conf.d/config.base']
        }).getConfig();
        expect(config.system?.locale).to.equal('en_us');
    });

    it('load with include', async () => {
        const config = new ConfigLoader<DemoConfig>(DemoConfig, {
            files: ['./test/conf.d/config.base'],
            useIncludes: true
        }).getConfig();
        expect(config.system?.locale).to.equal('zh_cn');
    });

    it('load with hot-reload', async () => {
        const config = new ConfigLoader<DemoConfig>(DemoConfig, {
            files: ['./test/conf.d/config.base'],
            useHotReload: true
        }).getConfig();
        expect(config.system?.locale).to.equal('en_us');
    });

    it('load error', async () => {
        try {
            new ConfigLoader<ErrorConfig>(ErrorConfig, {
                files: ['./test/conf.d/config.base']
            });
        } catch (err) {
            expect(err).to.exist;
        }
    });
});
