import _ from 'lodash';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { LogLevel } from 'nstarter-core';

import { DeployOperations } from './ops.deploy';
import { config } from '../config';
import { ALL_TEMPLATE_TAG, CLI_NAME } from '../constants';
import { clearTemplate, listTemplates, removeTemplate, updateTemplate } from './ops.template';
import { upgradeProjectWithTemplate } from './ops.upgrade';
import { setLogLevel } from '../logger';

/**
 * 命令执行入口
 */
export const runCli = () => {
    const argv = yargs(hideBin(process.argv))
        // 执行部署
        .command(
            '$0 deploy [target]',
            'CLI tools to deploy TypeScript project.',
            (yargs) => yargs
                .positional('target', {
                    describe: 'Target project deploy path.',
                    type: 'string'
                })
                .options({
                    name: {
                        alias: 'n',
                        describe: 'Project name.',
                        type: 'string'
                    },
                    template: {
                        alias: 't',
                        describe: 'Template to use.',
                        type: 'string'
                    },
                    yes: {
                        alias: 'y',
                        describe: 'Proceed deploy without confirm.',
                        default: false,
                        type: 'boolean'
                    }
                }),
            async (argv) => {
                await new DeployOperations(argv).deployProject();
            })
        // 修改配置
        .command(
            'config set <key> <value>',
            `Config ${ CLI_NAME } options.`,
            (yargs) => yargs
                .positional('key', {
                    describe: 'The key to set value at.',
                    type: 'string'
                })
                .positional('value', {
                    describe: 'The value to set.',
                    type: 'string'
                }),
            (argv) => {
                // 校验
                if (!argv.set && _.get(argv, ['_', 0]) === 'config') {
                    return;
                }
                config.setConfig(argv.key, argv.value);
            })
        // 列出所有已配置模板工程
        .command(
            ['list', 'ls'],
            'List all templates configured.',
            (yargs) => yargs,
            () => {
                    listTemplates();
                }
            )
        // 更新本地模板缓存
        .command(
            ['update [template]', 'up [template]'],
            'Update local template cache.',
            (yargs) => yargs
                .positional('template', {
                    describe: 'Template to update.',
                    type: 'string'
                }),
            async (argv) => {
                await updateTemplate(argv.template);
            })
        .command(
            ['upgrade [target]'],
            'Upgrade local project with template.',
            (yargs) => yargs
                .positional('target', {
                    describe: 'Target project directory.',
                    type: 'string'
                })
                .options({
                    template: {
                        alias: 't',
                        describe: 'Template to use.',
                        type: 'string'
                    },
                    strict: {
                        alias: 's',
                        describe: 'Use strict version rule to upgrade.',
                        type: 'boolean'
                    }
                }),
            async (argv) => {
                await upgradeProjectWithTemplate(argv.target, argv.template, argv.strict);
            }
        )
        // 清理模板
        .command(
            'clean [template]',
            'Clear local template cache.',
            (yargs) => yargs
                .positional('template', {
                    describe: 'Template to clear. Use "all" to clear all templates.',
                    default: ALL_TEMPLATE_TAG,
                    type: 'string'
                }),
            (argv) => {
                clearTemplate(argv.template);
            })
        // 删除模板
        .command(
            ['remove <template>', 'rm <template>'],
            'Remove selected template.',
            (yargs) => yargs
                .positional('template', {
                    describe: 'Template to remove.',
                    default: ALL_TEMPLATE_TAG,
                    type: 'string'
                }),
            (argv) => {
                removeTemplate(argv.template);
            })
        .options({
            verbose: {
                alias: 'v',
                describe: 'Show debug info.',
                type: 'boolean'
            }
        })
        .scriptName(CLI_NAME)
        .version(config.version)
        .detectLocale(false)
        .argv as any;
    const logLevel = argv.v ? LogLevel.debug : LogLevel.info;
    setLogLevel(logLevel);
};
