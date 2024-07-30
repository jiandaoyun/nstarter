import { ProjectModule } from '../installer/module.conf';

export interface IModuleConf {
    name: string;
    label: string;
    type: string;
    default: boolean;
    files: string[];
    config: string[];
    packages: string[];
    scripts: string[];
    dependencies: string[];
}

export interface IModuleGroupType {
    name: string;
    label: string;
}

export interface IProjectConf {
    modules: IModuleConf[];
    module_types: IModuleGroupType[];
    ignore_files: string[];
}

export interface IInitiatorConf {
    source: string;
    target: string;
    params: Record<string, string | number>;
    selectedModules: ProjectModule[];
    ignoredModules: ProjectModule[];
    ignoredFiles: string[];
}


export type TDependencyType = 'dependencies' | 'devDependencies' | 'peerDependencies';
export interface IDependencyMap {
    [key: string]: string;
}

export interface IPackageConf {
    dependencies?: IDependencyMap;
    devDependencies?: IDependencyMap;
    peerDependencies?: IDependencyMap;
}
