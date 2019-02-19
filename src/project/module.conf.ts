import _ from 'lodash';

export interface ModuleConf {
    name: string;
    label: string;
    type: string;
    default: boolean;
    files: string[];
    config: string[];
    packages: string[];
    scripts: string[]
}

export class ProjectModule implements ModuleConf {
    public readonly isValid: boolean;

    public readonly name: string;
    public readonly label: string;
    public readonly type: string;
    public readonly default: boolean;
    public readonly files: string[];
    public readonly config: string[];
    public readonly packages: string[];
    public readonly scripts: string[];

    constructor (conf: ModuleConf) {
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
        this.isValid = true;
    }
}
