import _ from 'lodash';
import fs from 'fs-extra';
import path from 'path';
import { spawn } from 'child_process';
import { safeLoad } from 'js-yaml';
import moment from 'moment-timezone';

import { ProjectModuleGroup } from './module.group';
import { logger } from '../logger';
import { ProjectModule } from './module.conf';
import { ProjectInitiator } from './initiator';
import { IDeployConf } from '../types/cli';
import { Utils } from '../utils';
import { IModuleConf, IModuleGroupType, IProjectConf } from '../types/installer';

/**
 * 目标工程安装器
 */
export class ProjectInstaller {
    public readonly isValid: boolean;
    private readonly _projectSrc: string;
    private readonly _options: IProjectConf;
    private _moduleGroups: ProjectModuleGroup[] = [];
    private _moduleGroupMap: Record<string, ProjectModuleGroup> = {};
    private _moduleMap: Record<string, ProjectModule> = {};

    constructor(src: string) {
        this._projectSrc = path.join(src, './template/');
        const moduleConf = path.join(src, './module.conf.yml');
        if (!fs.pathExistsSync(moduleConf)) {
            logger.error(`Module config file not found at "${ moduleConf }"`);
            this.isValid = false;
            return;
        }
        this._options = safeLoad(fs.readFileSync(moduleConf, 'utf-8'));
        this._loadModuleGroups();
        this._loadModules();
    }

    private _loadModuleGroups() {
        const o = this._options;
        if (!o.module_types) {
            logger.warn(`Module groups not found.`);
            return;
        }
        const moduleGroups = _.concat(o.module_types, {
            name: 'default',
            label: 'Default Modules'
        });
        _.forEach(moduleGroups, (groupConf: IModuleGroupType) => {
            const group = new ProjectModuleGroup(groupConf);
            if (group.isValid) {
                if (this._moduleGroupMap[group.name]) {
                    logger.warn(`Module group "${ group.name }" already loaded.`);
                    return;
                }
                this._moduleGroups.push(group);
                this._moduleGroupMap[group.name] = group;
            }
        });
    }

    private _loadModules() {
        const o = this._options;
        if (!o.module_types) {
            logger.warn(`Project modules not found.`);
            return;
        }
        _.forEach(o.modules, (moduleConf: IModuleConf) => {
            const module = new ProjectModule(moduleConf);
            if (module.isValid) {
                if (this._moduleMap[module.name]) {
                    logger.warn(`Project module "${ module.name }" already loaded.`);
                    return;
                }
                this._moduleMap[module.name] = module;
                // Load module for group
                const moduleGroup = this._moduleGroupMap[module.type];
                if (moduleGroup) {
                    moduleGroup.addModule(module);
                } else {
                    // Fallback to default group
                    this._moduleGroupMap['default'].addModule(module);
                }
            }
        });
    }

    public get moduleGroups() {
        return this._moduleGroups;
    }

    public async initialize(options: IDeployConf) {
        const selected = new Set(options.modules);
        const ignoredModules: ProjectModule[] = [],
            selectedModules: ProjectModule[] = [];
        _.forEach(this._moduleMap, (module, name) => {
            if (!selected.has(name)) {
                ignoredModules.push(module);
            } else {
                selectedModules.push(module);
            }
        });
        const initiator = new ProjectInitiator({
            source: this._projectSrc,
            target: options.workdir,
            params: {
                APP_NAME: options.name,
                YEAR: moment().year()
            },
            selectedModules,
            ignoredModules,
            ignoredFiles: this._options.ignore_files
        });
        await initiator.deploy();
    }

    public npmInitialize(options: IDeployConf, callback: Callback) {
        logger.info('run npm install');
        const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
        const npmProc = spawn(npmCmd, ['install'], {
            cwd: options.workdir,
            stdio: 'pipe'
        });
        npmProc.stdout.on('data', (data) => logger.debug(Utils.formatStdOutput(data)));
        npmProc.stderr.on('data', (data) => logger.warn(Utils.formatStdOutput(data)));
        npmProc.once('exit', (code) => {
            if (code !== 0) {
                return callback(new Error('npm install failed'));
            }
            return callback();
        });
    }
}
