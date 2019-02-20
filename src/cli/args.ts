import yargs, { Arguments, Argv } from 'yargs';

import { pkg } from '../pkg';

export interface ArgumentConf extends Arguments<{
    name?: string,
    template?: string,
    target?: string,
    verbose?: boolean
}> {}

export const args = yargs
    .options({
        name: {
            describe: 'Project name.',
            type: 'string'
        },
        template: {
            describe: 'Custom template project url.',
            type: 'string'
        },
        target: {
            describe: 'Set deploy path.',
            type: 'string'
        },
        verbose: {
            alias: 'v',
            describe: 'Show debug info.',
            type: 'boolean'
        }
    })
    .version(pkg.version);
