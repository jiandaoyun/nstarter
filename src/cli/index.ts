import _ from 'lodash';
import async from 'async';
import simpleGit, { outputHandler } from 'simple-git/promise';
import fs from 'fs-extra';
import path from 'path';
import yargs from 'yargs';

import { logger, LogLevel } from '../logger';
import { Utils } from '../utils';
import { pkg } from '../pkg';
import { DeployOperations } from './ops.deploy';
import { Config } from '../config';
import { IDeployConf } from '../types/cli';

export {
    IDeployConf
};

class Cli {
    private readonly _name = 'nstarter';
    private _config: Config;

    private readonly _homePath = process.env.USERPROFILE || process.env.HOME;

    private get _workDir(): string {
        if (this._homePath) {
            return path.join(this._homePath, `.${ this._name }`);
        }
        return path.resolve('./');
    }

    public initConfig(callback: Function) {
        this._config = new Config(this._workDir, callback);
    }

    private get _templatePath(): string {
        return path.join(this._workDir, '_template');
    }

    private get _gitHandler(): outputHandler {
        return (cmd, stdout, stderr) => {
            logger.debug(cmd);
            stdout.on('data', (data) => logger.debug(Utils.formatStdOutput(data)));
            stderr.on('data', (data) => logger.warn(Utils.formatStdOutput(data)));
        };
    }

    public prepareTemplate(callback: Function) {
        if (fs.pathExistsSync(this._templatePath) && !_.isEmpty(fs.readdirSync(this._templatePath))) {
            logger.debug('using cached template');
            return callback();
        }
        logger.info(`clone project template into "${ this._templatePath }"`);
        const git = simpleGit().outputHandler(this._gitHandler);
        async.auto({
            clone: (callback) => {
                fs.ensureDirSync(this._workDir);
                git.clone(this._config.getTemplate(), this._templatePath)
                    .then(() => callback());
            }
        }, (err) => callback(err));
    }

    public updateTemplate(callback: Function) {
        if (!fs.pathExistsSync(this._templatePath) || _.isEmpty(fs.readdirSync(this._templatePath))) {
            logger.error('could not find local template cache');
            return callback();
        }
        logger.info(`update project template at "${ this._templatePath }"`);
        const git = simpleGit(this._templatePath)
            .outputHandler(this._gitHandler);
        async.auto({
            update: (callback) => {
                git.pull().then(() => callback());
            }
        }, (err) => callback(err));
    }

    public runCommand(callback: Function) {
        const argv = yargs
            // deploy
            .command('$0 [target]', 'CLI tools to deploy TypeScript project.', (yargs) => yargs
                    .positional('target', {
                        describe: 'Target deploy path.',
                        type: 'string'
                    })
                    .options({
                        name: {
                            describe: 'Project name.',
                            type: 'string'
                        },
                        verbose: {
                            alias: 'v',
                            describe: 'Show debug info.',
                            type: 'boolean'
                        }
                    }), (argv) => {
                async.auto({
                    template: (callback) => this.prepareTemplate(callback),
                    deploy: ['template', (results, callback) => {
                        new DeployOperations(argv, this._templatePath)
                            .deployWithNpm(callback);
                    }]
                }, (err) => callback(err));
            })
            // config
            .command('config set <key> <value>', 'Config template starter options.', (yargs) => yargs
                    .positional('key', {
                        describe: 'The key to set value at.',
                        type: 'string'
                    })
                    .positional('value', {
                        describe: 'The value to set.',
                        type: 'string'
                    }), (argv) => {
                // check command
                if (!argv.set && _.get(argv, ['_', 0]) === 'config') {
                    return;
                }
                this._config.setConfig(argv.key, argv.value, callback);
            })
            // update template
            .command('update template', 'Update local template cache.', (yargs) => yargs, (argv) => {
                this.updateTemplate(callback);
            })
            // clean
            .command('clean', 'Clear local template cache.', (yargs) => yargs, (argv) => {
                if (!fs.pathExistsSync(this._templatePath)) {
                    return callback();
                }
                logger.info(`clear local template at "${ this._templatePath }"`);
                fs.emptyDirSync(this._templatePath);
                fs.rmdir(this._templatePath, (err) => callback(err));
            })
            .scriptName(this._name)
            .version(pkg.version)
            .detectLocale(false)
            .argv;
        if (argv.v) {
            logger.setLevel(LogLevel.debug);
        }
    }

    public run(callback: Function) {
        async.auto({
            config: (callback) => this.initConfig(callback),
            runCommand: ['config', (results, callback) => {
                this.runCommand(callback);
            }]
        }, (err) => callback(err));
    }
}

export const cli = new Cli();
