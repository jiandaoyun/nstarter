import async from 'async';
import { createPromptModule, PromptModule } from 'inquirer';

import { getDeployQuestions, DeployConf, npmInstallQuestions, NpmInstallConf } from './questions';
import { ArgumentConf, args } from './args';
import { logger, LogLevel } from '../logger';
import { project } from '../project';

export {
    DeployConf
}
class Cli {
    private _prompt: PromptModule;
    private _args: ArgumentConf;
    private _deployConf: DeployConf;

    constructor() {
        this._prompt = createPromptModule();
        this._args = args.argv;
        if (this._args.verbose) {
            logger.setLevel(LogLevel.debug);
        }
    }

    public deploy(callback: Function) {
        this._prompt(getDeployQuestions(this._args))
            .then((answers: DeployConf) => {
                this._deployConf = answers;
                if (!answers.confirm) {
                    return callback();
                }
                project.initialize(answers, callback);
            });
    }

    public npmInstall(callback: Function) {
        this._prompt(npmInstallQuestions)
            .then((answers: NpmInstallConf) => {
                if (!answers.npm) {
                    console.info('Skip npm install by user.')
                    return callback();
                }
                project.npmInitialize(this._deployConf, callback);
            });
    }

    public run() {
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
                logger.error(err);
                return process.exit(1);
            }
            return process.exit(0);
        });
    }
}

export const cli = new Cli();
