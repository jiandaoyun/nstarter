import type { ProjectModule } from './module.conf';
import type { IModuleGroupType } from './types';

export class ProjectModuleGroup implements IModuleGroupType {
    public readonly isValid: boolean;
    public readonly name: string;
    public readonly label: string;
    private _modules: ProjectModule[] = [];

    constructor (conf: IModuleGroupType) {
        if (!conf.name) {
            this.isValid = false;
            return;
        }
        this.name = conf.name;
        this.label = conf.label;
        this.isValid = true;
    }

    public addModule(module: ProjectModule) {
        this._modules.push(module);
    }

    public get modules () {
        return this._modules;
    }
}
