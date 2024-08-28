import _ from 'lodash';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { LogLevel } from 'nstarter-core';

import { config } from '../config';
import { ALL_REPO_TAG, CLI_NAME, DEFAULT_REPO_TAG } from '../constants';
import { RepoActions, ProjectActions } from '../actions';
import { setLogLevel } from '../logger';

export * from './types';
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
                    repo: {
                        alias: 'r',
                        describe: 'Template repository to use.',
                        default: DEFAULT_REPO_TAG,
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
                await ProjectActions.deployProject(argv);
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
            async () => {
                await RepoActions.printTemplates();
            })
        // 更新本地模板缓存
        .command(
            ['update [repo]', 'up [repo]'],
            'Update local repository cache.',
            (yargs) => yargs
                .positional('repo', {
                    describe: 'Template repository to update.',
                    type: 'string'
                }),
            async (argv) => {
                await RepoActions.updateRepo(argv.repo);
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
                    repo: {
                        alias: 'r',
                        describe: 'Template repository to use.',
                        default: DEFAULT_REPO_TAG,
                        type: 'string'
                    },
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
            (argv) => {
                ProjectActions.upgradeWithTemplate(argv.target, argv.repo, argv.template, argv.strict);
            }
        )
        // 清理模板
        .command(
            'clean [repo]',
            'Clear local repository cache.',
            (yargs) => yargs
                .positional('repo', {
                    describe: 'Repository to clear. Use "all" to clear all repositories.',
                    default: ALL_REPO_TAG,
                    type: 'string'
                }),
            (argv) => {
                RepoActions.clearRepoStorage(argv.repo);
            })
        // 删除模板
        .command(
            ['remove <repo>', 'rm <repo>'],
            'Remove selected repository.',
            (yargs) => yargs
                .positional('repo', {
                    describe: 'Repository to remove.',
                    default: ALL_REPO_TAG,
                    type: 'string'
                }),
            (argv) => {
                RepoActions.removeRepo(argv.repo);
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
