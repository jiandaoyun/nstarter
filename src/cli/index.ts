import _ from 'lodash';
import async from 'async';
import simpleGit, { outputHandler } from 'simple-git/promise';
import fs from 'fs-extra';
import path from 'path';
import yargs from 'yargs';

import { logger, LogLevel } from '../logger';
import { Utils } from '../utils';
import { DeployOperations } from './ops.deploy';
import { ToolConfig } from '../config';
import { DEFAULT_TEMPLATE, DEFAULT_TEMPLATE_TAG } from '../constants';

// eslint-disable-next-line @typescript-eslint/no-require-imports
export const pkg = require('../../package.json');

/**
 * 命令行调用入口
 */
class Cli {
    private readonly _name = 'nstarter';
    private readonly _workDir: string;
    private readonly _config: ToolConfig;

    /**
     * @constructor
     */
    constructor() {
        // 设定工作目录
        const homePath = process.env.USERPROFILE || process.env.HOME;
        if (homePath) {
            this._workDir = path.join(homePath, `.${ this._name }`);
        } else {
            this._workDir = path.resolve('./');
        }
        // 加载配置
        this._config = new ToolConfig(this._workDir);
    }

    /**
     * 获取模板工程工作目录路径
     * @param tag - 模板标签
     * @private
     */
    private _templatePath(tag: string): string {
        return path.join(this._workDir, `templates/${ tag }`);
    }

    /**
     * git 日志输出处理
     * @private
     */
    private get _gitHandler(): outputHandler {
        return (cmd, stdout, stderr) => {
            logger.debug(cmd);
            stdout.on('data', (data) => logger.debug(Utils.formatStdOutput(data)));
            stderr.on('data', (data) => logger.warn(Utils.formatStdOutput(data)));
        };
    }

    /**
     * 获取当前模板配置
     */
    public listTemplates() {
        const tags = this._config.listTemplateTags();
        if (_.isEmpty(tags)) {
            logger.warn('No templates has been configured.');
            return;
        }
        for (const tag of tags) {
            const template = this._config.getTemplate(tag);
            console.log(`${ tag } -> ${ template }`);
        }
    }

    /**
     * 初始化模板工程
     * @param tag - 模板标签，默认值为 default
     */
    public async prepareTemplate(tag = DEFAULT_TEMPLATE_TAG) {
        const templatePath = this._templatePath(tag);
        if (fs.pathExistsSync(templatePath) && !_.isEmpty(fs.readdirSync(templatePath))) {
            logger.debug('using cached template');
            return;
        }
        // 使用 git 拉取模板工程到本地工作目录
        logger.info(`clone project template into "${ templatePath }"`);
        fs.ensureDirSync(this._workDir);
        const git = simpleGit().outputHandler(this._gitHandler);
        // 选择模板
        let template = this._config.getTemplate();
        if (template) {
            logger.info(`using template "${ tag }" -> "${ template }"`);
        } else {
            logger.warn(`using default template "${ DEFAULT_TEMPLATE }"`);
            template = DEFAULT_TEMPLATE;
        }
        await git.clone(template, templatePath);
    }

    /**
     * 更新模板工程
     * @param tag - 模板标签，默认值为 default
     */
    public async updateTemplate(tag = DEFAULT_TEMPLATE_TAG) {
        const templatePath = this._templatePath(tag);
        if (!fs.pathExistsSync(templatePath) || _.isEmpty(fs.readdirSync(templatePath))) {
            logger.error('could not find local template cache');
            return;
        }
        logger.info(`update project template at "${ templatePath }"`);
        const git = simpleGit(templatePath)
            .outputHandler(this._gitHandler);
        await git.pull();
    }

    /**
     * 清空模板工程
     * @param tag - 模板标签，默认值为 default
     */
    public clearTemplate(tag = DEFAULT_TEMPLATE_TAG) {
        const templatePath = this._templatePath(tag);
        if (!fs.pathExistsSync(templatePath)) {
            return;
        }
        logger.info(`clear local template at "${ templatePath }"`);
        fs.emptyDirSync(templatePath);
        fs.rmdirSync(templatePath);
    }

    /**
     * 命令执行入口
     * @param callback
     */
    public run(callback: Callback) {
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
                (argv) => {
                        async.auto({
                            template: async () => this.prepareTemplate(),
                            deploy: ['template', (results, callback) => {
                                new DeployOperations(argv, this._templatePath(argv.template))
                                    .deployWithNpm(callback);
                            }]
                        }, (err) => callback(err));
                })
            // config
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
                    // check command
                    if (!argv.set && _.get(argv, ['_', 0]) === 'config') {
                        return;
                    }
                    this._config.setConfig(argv.key, argv.value);
                    return callback();
                })
            .command(
                ['list', 'ls'],
                'List all templates configured.',
                (yargs) => yargs,
                () => {
                        this.listTemplates();
                        return callback();
                    }
                )
            // 更新本地模板缓存
            .command(
                'update <template>',
                'Update local template cache.',
                (yargs) => yargs
                    .positional('template', {
                        describe: 'Template to update.',
                        default: DEFAULT_TEMPLATE_TAG,
                        type: 'string'
                    }),
                async (argv) => {
                    await this.updateTemplate(argv.template);
                    return callback();
                })
            // 清理模板
            .command(
                'clean <template>',
                'Clear local template cache.',
                (yargs) => yargs
                    .positional('template', {
                        describe: 'Template to clear. Use "all" to clear all templates.',
                        default: 'all',
                        type: 'string'
                    }),
                (argv) => {
                    this.clearTemplate(argv.template);
                    return callback();
                })
            .options({
                verbose: {
                    alias: 'v',
                    describe: 'Show debug info.',
                    type: 'boolean'
                }
            })
            .scriptName(this._name)
            .version(pkg.version)
            .detectLocale(false)
            .argv;
        if (argv.v) {
            logger.setLevel(LogLevel.debug);
        }
    }
}

export const cli = new Cli();
