import { DeployProject } from './project';
import { logger } from '../logger';

// TODO
export const project = new DeployProject('../ts-express-template');
project.deployModules(['mongodb', 'web'], (err: Error) => {
    err && logger.error(err);
});
