import _  from 'lodash';
import async  from 'async';
import glob from 'glob';
import fs from 'fs-extra';
import path from 'path';
import readline from 'readline';
import { safeLoad, safeDump } from 'js-yaml';
import simplegit from 'simple-git/promise';

import { logger } from '../logger';
import { Utils } from '../utils';
import { IInitiatorConf } from '../types/project';
import { promisify } from 'util';

/**
 * 工程初始化
 */
export class ProjectInitiator {
    private readonly _options: IInitiatorConf;
    private readonly _concurrency = 10;
    private _ignoredModuleSet: Set<string>;

    constructor(options: IInitiatorConf) {
        this._options = _.defaults(options, {
            params: {},
            ignoredModules: [],
            ignoredFiles: []
        });
        this._ignoredModuleSet = new Set(
            _.map(this._options.ignoredModules, 'name')
        );
    }

    /**
     *
     * @private
     */
    private _checkTargetPath() {
        const target = this._options.target;
        logger.info(`check target path "${ path.resolve(target) }"`);
        fs.ensureDirSync(target);
        const files = fs.readdirSync(target);
        if (!_.isEmpty(files)) {
            throw new Error('target is not an empty directory.');
        }
        logger.info('target is ready to deploy');
    }

    private _getSourcePath(relPath: string) {
        return path.join(this._options.source, relPath);
    }

    private _getTargetPath(relPath: string) {
        return path.join(this._options.target, relPath);
    }

    /**
     * 复制普通文件 (非代码)
     * @param path
     * @private
     */
    private async _copyFile(path: string) {
        const o = this._options;
        const isCodeFile = path.match(/(\.[tj]s|\.sh|makefile)$/i);
        if (_.isEmpty(o.params) || isCodeFile) {
            // 不替换代码文件中的模板参数
            fs.copyFileSync(
                this._getSourcePath(path),
                this._getTargetPath(path)
            );
        } else {
            // 替换文件中的模板参数
            const reader = readline.createInterface({
                input: fs.createReadStream(this._getSourcePath(path))
            });
            const output = fs.createWriteStream(this._getTargetPath(path));
            _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;
            for await (const line of reader) {
                try {
                    output.write(_.template(line)(o.params) + `\n`);
                } catch (e) {
                    // 忽略未定义模板参数以及其他错误
                    output.write(line + `\n`);
                }
            }
            output.close();
        }
    }

    /**
     * 复制代码文件
     *
     * 支持通过模板工程注释定义模块代码选择以适应不同选装模块需要
     *
     * @param path
     * @private
     */
    private async _copyCode(path: string) {
        const reader = readline.createInterface({
            input: fs.createReadStream(this._getSourcePath(path))
        });
        const output = fs.createWriteStream(this._getTargetPath(path));
        let isIgnored = false,
            isAlt = false;
        const moduleStack: string[] = [];
        // 代码模块选择
        for await (const line of reader) {
            let result = line;
            // 获取代码所属模块信息
            const moduleStart = _.get(line.match(/^\s*\/{2}#module\s+([\w|]+)$/), 1);
            if (moduleStart && this._isModuleIgnored(moduleStart)) {
                moduleStack.push(moduleStart);
                isIgnored = true;
            }
            const moduleEnd = _.get(line.match(/^\s*\/{2}#endmodule\s+([\w|]+)$/), 1);
            const moduleIdx = _.findLastIndex(moduleStack, (item) => item === moduleEnd);
            if (moduleEnd && moduleIdx !== -1) {
                _.pullAt(moduleStack, moduleIdx);
                isIgnored = !_.isEmpty(moduleStack);
            }
            // 获取选装模块的替代代码逻辑
            const altStart = _.get(line.match(/^\s*\/{2}(#alt)/), 1);
            if (altStart) {
                isAlt = true;
            }
            const altEnd = _.get(line.match(/^\s*\/{2}(#endalt)/), 1);
            if (altEnd) {
                isAlt = false;
            }
            const isModuleConf = moduleStart || moduleEnd || altStart || altEnd;
            if (isModuleConf) {
                return;
            }
            if (isAlt) {
                if (isIgnored) {
                    result = _.replace(line, /\/{2}#\s+/, '');
                } else {
                    return;
                }
            } else if (isIgnored) {
                return;
            }

            // 写入到目标工程文件
            output.write(`${ result }\n`);
        }
        output.close();
    }

    /**
     * 从模板工程读取 json 配置文件
     * @param path - 配置相对路径
     * @private
     */
    private async _readJsonConf(path: string) {
        return this._readConf(path, JSON.parse);
    }

    /**
     * 写入 json 配置到目标工程
     * @param obj - 配置内容
     * @param path - 配置相对路径
     * @private
     */
    private async _writeJsonConf(obj: object, path: string) {
        return this._writeConf(obj, path, (obj) =>
            JSON.stringify(obj, null, 2)
        );
    }

    /**
     * 从模板工程读取 yaml 配置文件
     * @param path - 配置相对路径
     * @private
     */
    private async _readYamlConf(path: string) {
        return this._readConf(path, safeLoad);
    }

    /**
     * 写入 yaml 配置到目标工程
     * @param obj - 配置内容
     * @param path - 配置相对路径
     * @private
     */
    private async _writeYamlConf(obj: object, path: string) {
        return this._writeConf(obj, path, (obj) =>
            safeDump(obj, { indent: 2 })
        );
    }

    /**
     * 读取配置文件基础方法
     * @param path - 配置相对路径
     * @param parse - 解析方法
     * @private
     */
    private async _readConf(path: string, parse: (str: string) => any) {
        const content = fs.readFileSync(this._getSourcePath(path), 'utf-8');
        return parse(content);
    }

    /**
     * 写入配置文件基础方法
     * @param obj - 配置内容
     * @param path - 配置相对路径
     * @param stringify - 格式化方法
     * @private
     */
    private async _writeConf(obj: object, path: string, stringify: (obj: any) => string) {
        const lineFeed = '\n';
        fs.writeFileSync(this._getTargetPath(path), stringify(obj) + lineFeed);
    }

    /**
     * 判定选装模块是否需要忽略
     * @param module - 模块标签
     * @private
     */
    private _isModuleIgnored(module: string): boolean {
        // 支持相同代码块同时被不同模块引用
        const modules = module.split('|');
        let isIgnored = true;
        _.forEach(modules, (name) => {
            // 满足任一需要，即不能忽略
            if (!this._ignoredModuleSet.has(name)) {
                isIgnored = false;
                return false;
            }
            return;
        });
        return isIgnored;
    }

    /**
     * 获取不需要被部署的选装组件文件路径
     * @private
     */
    private _getIgnoredPathList() {
        const o = this._options;
        // 允许相同文件被不同模块同时引用，只需足被任一模块使用，就需要保留
        const ignorePathList = _.flatten([
            o.ignoredFiles,
            ..._.map(o.ignoredModules, (module) => module.files)
        ]);
        const selectedPathList = _.flatten([
            ..._.map(o.selectedModules, (module) => module.files)
        ]);
        return _.difference(ignorePathList, selectedPathList);
    }

    /**
     * 基于模板部署文件到目标工程 (配置文件除外)
     */
    public async deployFiles() {
        const o = this._options;
        // 搜索文件
        const search = await promisify(glob)('**/*', {
            cwd: o.source,
            root: o.source,
            mark: true,
            dot: true,
            ignore: [
                'package.json',
                'conf.d/*',
                ...this._getIgnoredPathList()
            ]
        });

        // 对工程内部文件分类
        const group = _.groupBy(search, (path) => {
            if (path.match(/\/$/)) {
                return 'dir';
            } else if (path.match(/\.ts$/)) {
                return 'code';
            } else {
                return 'file';
            }
        });

        // 基于模板生成目标工程目录结构
        logger.info('create target directories');
        await async.eachLimit(group.dir, this._concurrency, async (path) => {
            logger.debug(`mkdir: ${ path }`);
            fs.ensureDirSync(this._getTargetPath(path));
        });

        // 复制普通文件
        logger.info('copy project files');
        await async.eachLimit(group.file, this._concurrency, async (path) => {
            logger.debug(`copy: ${ path }`);
            await this._copyFile(path);
        });

        // 部署代码文件
        logger.info('deploy code files');
        await async.eachLimit(group.code, this._concurrency, async (path) => {
            logger.debug(`deploy: ${ path }`);
            await this._copyCode(path);
        });
    }

    /**
     * 初始化目标工程配置文件
     * @param file - 文件相对路径
     * @param process - 配置文件处理方法
     * @private
     */
    private async _deployConfigs(file: string, process: (obj: any) => any) {
        logger.debug(`config: ${ file }`);
        if (/\.json$/.test(file)) {
            const conf = await this._readJsonConf(file);
            return this._writeJsonConf(process(conf), file);
        } else if (/\.ya?ml$/.test(file)) {
            const conf = await this._readYamlConf(file);
            return this._writeYamlConf(process(conf), file);
        } else {
            throw new Error(`Config file "${ file }" is not supported`);
        }
    }

    private _getIgnoredPackages() {
        const o = this._options;
        const ignoredPackages = _.flatten([..._.map(o.ignoredModules, (module) => module.packages)]),
            selectedPackages = _.flatten([..._.map(o.selectedModules, (module) => module.packages)]);
        return _.difference(ignoredPackages, selectedPackages);
    }

    private _getIgnoredScripts() {
        const o = this._options;
        const ignoredScripts = _.flatten([..._.map(o.ignoredModules, (module) => module.scripts)]),
            selectedScripts = _.flatten([..._.map(o.selectedModules, (module) => module.scripts)]);
        return _.difference(ignoredScripts, selectedScripts);
    }

    /**
     * 部署 npm 配置
     */
    public async deployPackageConf() {
        const o = this._options;
        return this._deployConfigs('package.json', (pkg: any) => {
            const ignoredPackages = this._getIgnoredPackages(),
                ignoredScripts = this._getIgnoredScripts();
            if (o.params.APP_NAME) {
                pkg.name = o.params.APP_NAME;
            }
            pkg.dependencies = _.omit(pkg.dependencies, ignoredPackages);
            pkg.devDependencies = _.omit(pkg.devDependencies, ignoredPackages);
            pkg.scripts = _.omit(pkg.scripts, ignoredScripts);
            return pkg;
        });
    }

    /**
     * 部署工程配置
     */
    public async deployProjectConf() {
        const o = this._options;
        const ignoredConf = _.concat([], ..._.map(o.ignoredModules, 'config'));
        const ignorePathList: string[][] = [];
        _.forEach(o.ignoredModules, (module) => {
            ignorePathList.push(module.files);
        });
        // 搜索文件
        const search = await promisify(glob)('conf.d/*', {
            cwd: o.source,
            root: o.source,
            mark: true,
            ignore: _.concat(
                ['conf.d/config.override.*'],
                ...ignorePathList
            )
        });
        // 部署配文件
        await async.eachLimit(search, this._concurrency, async (file) =>
            this._deployConfigs(file, (conf) => {
                _.forEach(ignoredConf, (confPath) => {
                    _.unset(conf, confPath);
                });
                return conf;
            })
        );
    }

    /**
     * git 项目初始化配置 (建立目标工程版本控制)
     */
    public async gitInitialize() {
        const target = this._options.target;
        const git = simplegit(target)
            .outputHandler((cmd, stdout, stderr) => {
                logger.debug(cmd);
                stdout.on('data', (data) => logger.debug(Utils.formatStdOutput(data)));
                stderr.on('data', (data) => logger.warn(Utils.formatStdOutput(data)));
            });
        logger.info(`git init at "${ target }"`);
        await git.init();
        await git.add('./*');
        await git.commit('initial commit');
    }

    /**
     * 按照模板工程配置部署初始化目标工程
     */
    public async deploy() {
        // 检查目标目录结构
        this._checkTargetPath();
        // 部署工程文件
        await this.deployFiles();
        // 配置文件处理
        await this.deployPackageConf();
        await this.deployProjectConf();
        // git 项目处理
        await this.gitInitialize();
        logger.info(`project successfully deployed at "${ path.resolve(this._options.target) }"`);
    }
}
