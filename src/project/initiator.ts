import _, { Dictionary } from 'lodash';
import async, { AsyncResultCallback } from 'async';
import glob from 'glob';
import fs from 'fs-extra';
import path from 'path';
import readline from 'readline';


import { ProjectModule } from './module.conf';
import { logger } from '../logger';

interface InitiatorConf {
    source: string,
    target: string,
    ignoredModules: ProjectModule[],
    ignoredFiles: string[]
}

export class ProjectInitiator {
    private _options: InitiatorConf;
    private readonly _concurrency = 10;
    private _ignoredModuleSet: Set<string>;

    constructor (options: InitiatorConf) {
        this._options = _.defaults(options, {
            ignoredModules: [],
            ignoredFiles: []
        });
        this._ignoredModuleSet = new Set(
            _.map(this._options.ignoredModules, 'name')
        );
    }

    private _getSourcePath(relPath: string) {
        return path.join(this._options.source, relPath);
    }

    private _getTargetPath(relPath: string) {
        return path.join(this._options.target, relPath);
    }

    private _createDirectory (path: string, callback: Function) {
        return fs.ensureDir(this._getTargetPath(path), (err) => callback(err));
    }

    private _copyFile(path: string, callback: Function) {
        fs.copyFile(
            this._getSourcePath(path),
            this._getTargetPath(path),
            (err) => callback(err)
        );
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
            if (isAlt) {
                line = _.replace(line, /\/{2}#\s+/, '');
            }
            const isModuleConf = moduleStart || moduleEnd || altStart || altEnd;
            if ((!isIgnored || isAlt) && !isModuleConf) {
                // Write to target file
                output.write(`${ line }\n`);
            }
        });
        reader.on('close', () => {
            output.close();
            return callback();
        });
    }

    private _readJson(path: string, callback: Function) {
        async.auto<{
            read: string,
            parse: object
        }>({
            read: (callback) => {
                fs.readFile(this._getSourcePath(path), 'utf-8', callback);
            },
            parse: ['read', (results, callback) => {
                return callback(null, JSON.parse(results.read));
            }]
        }, (err, results) => callback(err, results && results.parse))
    }

    private _writeJson(obj: object, path: string, callback: Function) {
        const content = JSON.stringify(obj, null, 2);
        fs.writeFile(this._getTargetPath(path), content, (err) => callback(err));
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
                        'config.schema.json',
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
                async.eachLimit(results.group.dir, this._concurrency, (path, callback) => {
                    logger.info(`mkdir: ${ path }`);
                    this._createDirectory(path, callback);
                }, (err) => callback(err));
            }],
            // Copy search results to target folder
            copy: ['mkdir', (results, callback) => {
                async.eachLimit(results.group.file, this._concurrency, (path, callback) => {
                    logger.info(`copy: ${ path }`);
                    this._copyFile(path, callback);
                }, (err) => callback(err));
            }],
            // Deploy code files
            deploy: ['mkdir', (results, callback) => {
                async.eachLimit(results.group.code, this._concurrency, (path, callback) => {
                    logger.info(`deploy: ${ path }`);
                    this._copyCode(path, callback);
                }, (err) => callback(err));
            }]
        }, (err) => callback(err));
    }

    public deployPackageConf (callback: Function) {
        const o = this._options;
        const file = 'package.json';
        logger.info(`config: ${ file }`);
        async.auto<{
            read: any,
            config: object,
            write: void
        }>({
            read: (callback) => {
                this._readJson(file, callback);
            },
            config: ['read', (results, callback: AsyncResultCallback<object>) => {
                const pkg = results.read;
                const ignoredPackages = _.concat([], ..._.map(o.ignoredModules, 'packages'));
                const ignoredScripts = _.concat([], ..._.map(o.ignoredModules, 'scripts'));
                pkg.dependencies = _.omit(pkg.dependencies, ignoredPackages);
                pkg.devDependencies = _.omit(pkg.devDependencies, ignoredPackages);
                pkg.scripts = _.omit(pkg.scripts, ignoredScripts);
                return callback(null, pkg);
            }],
            write: ['config', (results, callback) => {
                this._writeJson(results.config, file, callback);
            }]
        }, (err) => callback(err));
    }

    public deploy(callback: Function) {
        async.auto({
            files: (callback) => {
                this.deployFiles(callback);
            },
            package: ['files', (results, callback) => {
                this.deployPackageConf(callback);
            }]
        }, (err) => callback(err));
    }
}
