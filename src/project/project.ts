import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import { safeLoad } from 'js-yaml';

import { ProjectModuleGroup, ModuleGroupType } from './module.group';
import { logger } from '../logger';
import { ProjectModule, ModuleConf } from './module.conf';
import { ProjectInitiator } from './initiator';

interface ProjectConf {
    modules: ModuleConf[];
    module_types: ModuleGroupType[];
    ignore_files: string[];
}

export class DeployProject {
    public readonly isValid: boolean;
    private _projectSrc: string;
    private _options: ProjectConf;
    private _moduleGroups: ProjectModuleGroup[] = [];
    private _moduleGroupMap: Record<string, ProjectModuleGroup> = {};
    private _moduleMap: Record<string, ProjectModule> = {};

    constructor(src: string) {
        this._projectSrc = src;
        const moduleConf = path.join(src, './module.conf.yml');
        if (!fs.existsSync(moduleConf)) {
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
        _.forEach(moduleGroups, (groupConf: ModuleGroupType) => {
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
        _.forEach(o.modules, (moduleConf: ModuleConf) => {
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

    public deployModules(selected: string[], callback: Function) {
        const selectedModules = new Set(selected);
        const ignoredModules: ProjectModule[] = [];
        _.forEach(this._moduleMap, (module, name) => {
            if (!selectedModules.has(name)) {
                ignoredModules.push(module);
            }
        });
        const initiator = new ProjectInitiator({
            source: this._projectSrc,
            target: 'D:/temp/',
            ignoredModules: ignoredModules,
            ignoredFiles: this._options.ignore_files
        });
        initiator.deploy(callback);
    }
}
