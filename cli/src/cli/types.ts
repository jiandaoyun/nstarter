import type { Arguments } from 'yargs';

export interface ITemplateConf {
    readonly repo: string;
    readonly template: string;
}

export interface IDeployConf {
    readonly name: string;
    readonly workdir: string;
    readonly modules: string[];
    readonly confirm: boolean;
}

export interface INpmInstallConf {
    readonly npm: boolean;
}

export interface IDeployArguments extends Arguments<{
    name?: string,
    repo?: string,
    template?: string,
    target?: string,
    verbose?: boolean,
    yes?: boolean
}> {}
