import { Arguments } from 'yargs';

export interface DeployArguments extends Arguments<{
    name?: string,
    target?: string,
    verbose?: boolean
}> {}
