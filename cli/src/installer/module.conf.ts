import type { IModuleConf } from '../types/installer';

export class ProjectModule implements IModuleConf {
    public readonly isValid: boolean;

    public readonly name: string;
    public readonly label: string;
    public readonly type: string;
    public readonly default: boolean;
    public readonly files: string[];
    public readonly config: string[];
    public readonly packages: string[];
    public readonly scripts: string[];
    public readonly dependencies: string[];

    constructor (conf: IModuleConf) {
        if (!conf.name && !conf.type) {
            this.isValid = false;
            return;
        }
        this.name = conf.name;
        this.label = conf.label;
        this.type = conf.type;
        this.default = !!conf.default;
        this.files = conf.files || [];
        this.config = conf.config || [];
        this.packages = conf.packages || [];
        this.scripts = conf.scripts || [];
        this.dependencies = conf.dependencies || [];
        this.isValid = true;
    }
}
