import { ProjectModule } from './module.conf';

export interface ModuleGroupType {
    name: string;
    label: string;
}

export class ProjectModuleGroup implements ModuleGroupType {
    public readonly isValid: boolean;
    public readonly name: string;
    public readonly label: string;
    private _modules: ProjectModule[] = [];

    constructor (conf: ModuleGroupType) {
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
