import _ from 'lodash';
import { promisify } from 'util';
import { createPromptModule, PromptModule } from 'inquirer';

import { getDeployQuestions, getTemplateQuestions, npmInstallQuestions } from './questions';
import { ProjectInstaller } from '../installer';
import { logger } from '../logger';
import { IDeployArguments, IDeployConf, INpmInstallConf, ITemplateConf } from '../types/cli';
import { prepareTemplate } from './ops.template';


/**
 * 部署操作
 */
export class DeployOperations {
    private readonly _prompt: PromptModule;
    private readonly _args: IDeployArguments;
    private _deployConf: IDeployConf;
    private _project: ProjectInstaller;

    /**
     * @param args
     * @constructor
     */
    constructor (args: IDeployArguments) {
        this._prompt = createPromptModule();
        this._args = args;
    }

    /**
     * 选定并初始化模板工程
     */
    public async selectTemplate() {
        let templateTag = this._args.template;
        if (!templateTag) {
            const answers = await this._prompt(getTemplateQuestions(this._args)) as ITemplateConf;
            templateTag = answers.template;
        }
        await prepareTemplate(templateTag);
        this._project = new ProjectInstaller(templateTag);
    }

    /**
     * 目标项目工程部署
     */
    public async projectDeploy() {
        const answers = await this._prompt(getDeployQuestions(this._args, this._project)) as IDeployConf;
        const resultAnswers = _.defaults({
            name: this._args.name,
            workdir: this._args.target
        }, answers);
        this._deployConf = resultAnswers;
        if (!(resultAnswers.confirm || this._args.yes)) {
            return;
        }
        await this._project.initializeProject(resultAnswers);
    }

    /**
     * 目标项目工程依赖安装
     */
    public async projectNpmInstall() {
        const answers = await this._prompt(npmInstallQuestions) as INpmInstallConf;
        if (!(this._deployConf.confirm || this._args.yes)) {
            // 直接安装，无需确认
            return;
        }
        if (answers.npm === false) {
            logger.info('Skip npm install by user.');
            return;
        }
        await promisify(this._project.npmInitialize)(this._deployConf);
    }

    /**
     * 部署工程
     */
    public async deployProject() {
        await this.selectTemplate();
        await this.projectDeploy();
        await this.projectNpmInstall();
        logger.info('deploy job finished.');
    }
}
