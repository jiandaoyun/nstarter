import _ from 'lodash';
import yargs from 'yargs';

import { logger, LogLevel } from '../logger';
import { DeployOperations } from './ops.deploy';
import { config } from '../config';
import { ALL_TEMPLATE_TAG, CLI_NAME, DEFAULT_TEMPLATE_TAG } from '../constants';
import { clearTemplate, listTemplates, prepareTemplate, removeTemplate, updateTemplate } from './ops.template';

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const pkg = require('../../package.json');

/**
 * 命令执行入口
 */
export const runCli = () => {
    const argv = yargs
        // 执行部署
        .command(
            '$0 <target>',
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
                        default: DEFAULT_TEMPLATE_TAG,
                        type: 'string'
                    }
                }),
            async (argv) => {
                await prepareTemplate(argv.template);
                const templatePath = config.getTemplatePath(argv.template);
                await new DeployOperations(argv, templatePath).deployWithNpm();
            })
        // 修改配置
        .command(
            'config set <key> <value>',
            'Config template starter options.',
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
            'update [template]',
            'Update local template cache.',
            (yargs) => yargs
                .positional('template', {
                    describe: 'Template to update.',
                    default: DEFAULT_TEMPLATE_TAG,
                    type: 'string'
                }),
            async (argv) => {
                await updateTemplate(argv.template);
            })
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
        .version(pkg.version)
        .detectLocale(false)
        .argv;
    if (argv.v) {
        logger.setLevel(LogLevel.debug);
    }
};
