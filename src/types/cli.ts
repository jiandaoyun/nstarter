import { Arguments } from 'yargs';

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
    target?: string,
    verbose?: boolean
}> {}
