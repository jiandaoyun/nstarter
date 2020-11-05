import _ from 'lodash';
import async from 'async';
import { createPromptModule, PromptModule } from 'inquirer';

import { getDeployQuestions, npmInstallQuestions } from './questions';
import { ProjectInstaller } from '../installer';
import { logger } from '../logger';
import { IDeployArguments, IDeployConf, INpmInstallConf } from '../types/cli';


export class DeployOperations {
    private _prompt: PromptModule;
    private _deployConf: IDeployConf;
    private _args: IDeployArguments;
    private _project: ProjectInstaller;

    constructor (args: IDeployArguments, template: string) {
        this._prompt = createPromptModule();
        this._args = args;
        this._project = new ProjectInstaller(template);
    }

    public async deploy() {
        await this._prompt(getDeployQuestions(this._args, this._project))
            .then(async (answers: IDeployConf) => {
                const resultAnswers = _.defaults({
                    name: this._args.name,
                    workdir: this._args.target
                }, answers);
                this._deployConf = resultAnswers;
                if (!resultAnswers.confirm) {
                    return;
                }
                await this._project.initialize(resultAnswers);
            });
    }

    public npmInstall(callback: Callback) {
        this._prompt(npmInstallQuestions)
            .then((answers: INpmInstallConf) => {
                if (answers.npm === false) {
                    logger.info('Skip npm install by user.');
                    return callback();
                }
                this._project.npmInitialize(this._deployConf, callback);
            });
    }

    public async deployWithNpm() {
        await this.deploy();
        await async.auto({
            npm: (callback) => {
                if (!this._deployConf.confirm) {
                    return callback();
                }
                this.npmInstall(callback);
            }
        });
        logger.info('deploy job finished.');
    }
}
