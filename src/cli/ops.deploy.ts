import _ from 'lodash';
import async from 'async';
import { createPromptModule, PromptModule } from 'inquirer';

import {
    getDeployQuestions,
    DeployConf,
    npmInstallQuestions,
    NpmInstallConf
} from './questions';
import { DeployProject } from '../project';
import { DeployArguments } from './args';
import { logger } from '../logger';


export class DeployOperations {
    private _prompt: PromptModule;
    private _deployConf: DeployConf;
    private _args: DeployArguments;
    private _project: DeployProject;

    constructor (args: DeployArguments, template: string) {
        this._prompt = createPromptModule();
        this._args = args;
        this._project = new DeployProject(template);
    }

    public deploy(callback: Function) {
        this._prompt(getDeployQuestions(this._args, this._project))
            .then((answers: DeployConf) => {
                const resultAnswers = _.defaults({
                    name: this._args.name,
                    workdir: this._args.target
                }, answers);
                this._deployConf = resultAnswers;
                if (!resultAnswers.confirm) {
                    return callback();
                }
                this._project.initialize(resultAnswers, callback);
            });
    }

    public npmInstall(callback: Function) {
        this._prompt(npmInstallQuestions)
            .then((answers: NpmInstallConf) => {
                if (answers.npm === false) {
                    logger.info('Skip npm install by user.');
                    return callback();
                }
                this._project.npmInitialize(this._deployConf, callback);
            });
    }

    public deployWithNpm(callback: Function) {
        async.auto({
            deploy: (callback) => {
                this.deploy(callback);
            },
            npm: ['deploy', (results, callback) => {
                if (!this._deployConf.confirm) {
                    return callback();
                }
                this.npmInstall(callback);
            }]
        }, (err) => {
            if (err) {
                return callback(err);
            }
            logger.info('deploy job finished.');
            return callback();
        });
    }
}
