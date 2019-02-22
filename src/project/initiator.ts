import _, { Dictionary } from 'lodash';
import async, { AsyncResultCallback } from 'async';
import glob from 'glob';
import fs from 'fs-extra';
import path from 'path';
import readline from 'readline';
import { safeLoad, safeDump } from 'js-yaml';
import simplegit from 'simple-git/promise';

import { ProjectModule } from './module.conf';
import { logger } from '../logger';
import { Utils } from '../utils';

interface InitiatorConf {
    source: string,
    target: string,
    params: Record<string, string | number>,
    ignoredModules: ProjectModule[],
    ignoredFiles: string[]
}

export class ProjectInitiator {
    private _options: InitiatorConf;
    private readonly _concurrency = 10;
    private _ignoredModuleSet: Set<string>;

    constructor(options: InitiatorConf) {
        this._options = _.defaults(options, {
            params: {},
            ignoredModules: [],
            ignoredFiles: []
        });
        this._ignoredModuleSet = new Set(
            _.map(this._options.ignoredModules, 'name')
        );
    }

    private _checkTargetPath(callback: Function) {
        const target = this._options.target;
        logger.info(`check target path "${ path.resolve(target) }"`);
        fs.ensureDirSync(target);
        fs.readdir(target, (err, files) => {
            if (err || !_.isEmpty(files)) {
                return callback(err || new Error('target is not an empty directory.'));
            }
            logger.info('target is ready to deploy');
            return callback();
        });
    }

    private _getSourcePath(relPath: string) {
        return path.join(this._options.source, relPath);
    }

    private _getTargetPath(relPath: string) {
        return path.join(this._options.target, relPath);
    }

    private _createDirectory(path: string, callback: Function) {
        return fs.ensureDir(this._getTargetPath(path), (err) => callback(err));
    }

    private _copyFile(path: string, callback: Function) {
        const o = this._options;
        const isCodeFile = path.match(/\.[tj]s$/);
        if (_.isEmpty(o.params) || isCodeFile) {
            // no need to replace custom params
            fs.copyFile(
                this._getSourcePath(path),
                this._getTargetPath(path),
                (err) => callback(err)
            );
        } else {
            // replace params
            const reader = readline.createInterface({
                input: fs.createReadStream(this._getSourcePath(path))
            });
            const output = fs.createWriteStream(this._getTargetPath(path));
            reader.on('line', (line) => {
                output.write(_.template(line)(o.params) + `\n`);
            });
            reader.on('close', () => {
                output.close();
                return callback();
            });
        }
    }

    private _copyCode(path: string, callback: Function) {
        const reader = readline.createInterface({
            input: fs.createReadStream(this._getSourcePath(path))
        });
        const output = fs.createWriteStream(this._getTargetPath(path));
        let isIgnored = false,
            isAlt = false;
        const moduleStack: string[] = [];
        reader.on('line', (line) => {
            // check project module
            const moduleStart = _.get(line.match(/^\s*\/{2}#module\s+(\w+)$/), 1);
            if (moduleStart && this._isModuleIgnored(moduleStart)) {
                moduleStack.push(moduleStart);
                isIgnored = true;
            }
            const moduleEnd = _.get(line.match(/^\s*\/{2}#endmodule\s+(\w+)$/), 1);
            const moduleIdx = _.findLastIndex(moduleStack, (item) => item === moduleEnd);
            if (moduleEnd && moduleIdx !== -1) {
                _.pullAt(moduleStack, moduleIdx);
                isIgnored = !_.isEmpty(moduleStack);
            }
            // check module alternative line
            const altStart = _.get(line.match(/^\s*\/{2}(#alt)/), 1);
            if (altStart) {
                isAlt = true;
            }
            const altEnd = _.get(line.match(/^\s*\/{2}(#endalt)/), 1)
            if (altEnd) {
                isAlt = false;
            }
            const isModuleConf = moduleStart || moduleEnd || altStart || altEnd;
            if (isModuleConf) {
                return;
            }
            if (isAlt) {
                if (isIgnored) {
                    line = _.replace(line, /\/{2}#\s+/, '');
                } else {
                    return;
                }
            } else if (isIgnored) {
                return;
            }

            // Write to target file
            output.write(`${line}\n`);
        });
        reader.on('close', () => {
            output.close();
            return callback();
        });
    }

    private _readJson(path: string, callback: Function) {
        this._readConf(path, JSON.parse, callback);
    }

    private _writeJson(obj: object, path: string, callback: Function) {
        this._writeConf(obj, path, (obj) => JSON.stringify(obj, null, 2), callback);
    }

    private _readYaml(path: string, callback: Function) {
        this._readConf(path, safeLoad, callback);
    }

    private _writeYaml(obj: object, path: string, callback: Function) {
        this._writeConf(obj, path, (obj) => safeDump(obj, { indent: 2 }), callback);
    }

    private _readConf(path: string, parse: (str: string) => any, callback: Function) {
        async.auto<{
            read: string,
            parse: any
        }>({
            read: (callback) => {
                fs.readFile(this._getSourcePath(path), 'utf-8', callback);
            },
            parse: ['read', (results, callback: AsyncResultCallback<any>) => {
                return callback(null, parse(results.read));
            }]
        }, (err, results) => callback(err, results && results.parse))
    }

    private _writeConf(obj: object, path: string, stringify: (obj: any) => string, callback: Function) {
        const lineFeed = '\n';
        fs.writeFile(this._getTargetPath(path), stringify(obj) + lineFeed, (err) => callback(err));
    }

    private _isModuleIgnored(module: string): boolean {
        return this._ignoredModuleSet.has(module);
    }

    public deployFiles(callback: Function) {
        const o = this._options;
        const ignorePathList = [o.ignoredFiles]
        _.forEach(o.ignoredModules, (module) => {
            ignorePathList.push(module.files);
        });
        async.auto<{
            search: string[],
            group: Dictionary<string[]>,
            mkdir: void,
            copy: void,
            deploy: void
        }>({
            // Search project files excluded by ignore pattern
            search: (callback) => {
                glob('**/*', {
                    cwd: o.source,
                    root: o.source,
                    mark: true,
                    dot: true,
                    ignore: _.concat([
                        'package.json',
                        'conf.d/*'
                    ], ...ignorePathList)
                }, callback);
            },
            group: ['search', (results, callback: AsyncResultCallback<Dictionary<string[]>>) => {
                const group = _.groupBy(results.search, (path) => {
                    if (path.match(/\/$/)) {
                        return 'dir';
                    } else if (path.match(/\.ts$/)) {
                        return 'code';
                    } else {
                        return 'file';
                    }
                });
                return callback(null, group);
            }],
            // Create directory structure
            mkdir: ['group', (results, callback) => {
                logger.info('create target directories');
                async.eachLimit(results.group.dir, this._concurrency, (path, callback) => {
                    logger.debug(`mkdir: ${path}`);
                    this._createDirectory(path, callback);
                }, (err) => callback(err));
            }],
            // Copy search results to target folder
            copy: ['mkdir', (results, callback) => {
                logger.info('copy project files');
                async.eachLimit(results.group.file, this._concurrency, (path, callback) => {
                    logger.debug(`copy: ${path}`);
                    this._copyFile(path, callback);
                }, (err) => callback(err));
            }],
            // Deploy code files
            deploy: ['mkdir', (results, callback) => {
                logger.info('deploy code files');
                async.eachLimit(results.group.code, this._concurrency, (path, callback) => {
                    logger.debug(`deploy: ${path}`);
                    this._copyCode(path, callback);
                }, (err) => callback(err));
            }]
        }, (err) => callback(err));
    }

    private _deploySettings(file: string, process: (obj: any) => any, callback: Function) {
        let read: (callback: Function) => void,
            write: (obj: object, callback: Function) => void;
        if (/\.json$/.test(file)) {
            read = (callback) => this._readJson(file, callback);
            write = (obj, callback) => this._writeJson(obj, file, callback);
        } else if (/\.ya?ml$/.test(file)) {
            read = (callback) => this._readYaml(file, callback);
            write = (obj, callback) => this._writeYaml(obj, file, callback);
        } else {
            return callback(new Error(`Config file "${file}" is not supported`));
        }
        logger.debug(`config: ${file}`);
        async.auto<{
            read: any,
            config: object,
            write: void
        }>({
            read: (callback) => {
                read(callback);
            },
            config: ['read', (results, callback: AsyncResultCallback<object>) => {
                return callback(null, process(results.read));
            }],
            write: ['config', (results, callback) => {
                write(results.config, callback);
            }]
        }, (err) => callback(err));
    }

    public deployPackageConf(callback: Function) {
        const o = this._options;
        this._deploySettings('package.json', (pkg: any) => {
            const ignoredPackages = _.concat([], ..._.map(o.ignoredModules, 'packages'));
            const ignoredScripts = _.concat([], ..._.map(o.ignoredModules, 'scripts'));
            if (o.params.APP_NAME) {
                pkg.name = o.params.APP_NAME;
            }
            pkg.dependencies = _.omit(pkg.dependencies, ignoredPackages);
            pkg.devDependencies = _.omit(pkg.devDependencies, ignoredPackages);
            pkg.scripts = _.omit(pkg.scripts, ignoredScripts);
            return pkg;
        }, callback);
    }

    public deployProjectConf(callback: Function) {
        const o = this._options;
        const ignoredConf = _.concat([], ..._.map(o.ignoredModules, 'config'))
        const ignorePathList: string[][] = []
        _.forEach(o.ignoredModules, (module) => {
            ignorePathList.push(module.files);
        });
        async.auto<{
            search: string[],
            deploy: void
        }>({
            search: (callback) => {
                glob('conf.d/*', {
                    cwd: o.source,
                    root: o.source,
                    mark: true,
                    ignore: _.concat(
                        ['conf.d/config.override.*'],
                        ...ignorePathList
                    )
                }, callback);
            },
            deploy: ['search', (results, callback) => {
                async.eachLimit(results.search, this._concurrency, (file, callback) => {
                    this._deploySettings(file, (conf) => {
                        _.forEach(ignoredConf, (confPath) => {
                            _.unset(conf, confPath);
                        });
                        return conf;
                    }, callback);
                }, (err) => callback(err));
            }]
        }, (err) => callback(err));
    }

    public gitInitialize(callback: Function) {
        const target = this._options.target;
        const git = simplegit(target)
            .outputHandler((cmd, stdout, stderr) => {
                logger.debug(cmd);
                stdout.on('data', (data) => logger.debug(Utils.formatStdOutput(data)));
                stderr.on('data', (data) => logger.warn(Utils.formatStdOutput(data)));
            });
        logger.info(`git init at "${target}"`);
        async.auto({
            init: (callback) => {
                git.init()
                    .then(() => callback());
            },
            add: ['init', (results, callback) => {
                git.add('./*')
                    .then(() => callback());
            }],
            commit: ['add', (results, callback) => {
                git.commit('initial commit')
                    .then(() => callback());
            }]
        }, (err) => callback(err));
    }

    public deploy(callback: Function) {
        async.auto({
            check: (callback) => {
                this._checkTargetPath(callback);
            },
            files: ['check', (results, callback) => {
                this.deployFiles(callback);
            }],
            package: ['files', (results, callback) => {
                this.deployPackageConf(callback);
            }],
            conf: ['files', (results, callback) => {
                this.deployProjectConf(callback);
            }],
            git: ['package', 'conf', (results, callback) => {
                this.gitInitialize(callback);
            }]
        }, (err) => {
            if (err) {
                return callback(err);
            }
            const target = this._options.target;
            logger.info(`project successfully deployed at "${ path.resolve(target) }"`);
            return callback();
        });
    }
}
