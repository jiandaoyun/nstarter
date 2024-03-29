import _ from 'lodash';
import { promisify } from 'util';
import { createPromptModule, PromptModule } from 'inquirer';
import { Logger } from 'nstarter-core';

import { getDeployQuestions, getTemplateQuestions, getTemplateUpdateQuestions, npmInstallQuestions } from './questions';
import { ProjectInstaller } from '../installer';
import { IDeployArguments, IDeployConf, INpmInstallConf, ITemplateConf } from '../types/cli';
import { prepareTemplate, updateTemplate } from './ops.template';
import { gitCheckTemplateVersion } from './ops.git';
import { config } from '../config';


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
        if (templateTag && !config.isTemplateExisted(templateTag)) {
            Logger.warn(`Template "${ templateTag }" is not defined.`);
            templateTag = undefined;
        }
        if (!templateTag) {
            const answers = await this._prompt(getTemplateQuestions(this._args)) as ITemplateConf;
            templateTag = answers.template;
        }
        await prepareTemplate(templateTag);
        // 检查是否需要更新
        const rev = await gitCheckTemplateVersion(config.getTemplatePath(templateTag));
        if (!rev) {
            Logger.warn(`Template "${ templateTag }" is not up-to-date.`);
            const answers = await this._prompt(getTemplateUpdateQuestions(this._args));
            if (answers.update) {
                await updateTemplate(templateTag);
            }
        } else {
            Logger.debug(`Template "${ templateTag }" is up-to-date.`);
        }
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
        if (!resultAnswers.confirm && !this._args.yes) {
            return;
        }
        await this._project.initializeProject(resultAnswers);
    }

    /**
     * 目标项目工程依赖安装
     */
    public async projectNpmInstall() {
        if (!this._args.yes) {
            if (!this._deployConf.confirm) {
                // 未部署直接跳过操作
                return;
            }
            // 确认是否需要安装 npm
            const answers = await this._prompt(npmInstallQuestions) as INpmInstallConf;
            if (!answers.npm) {
                Logger.info('Skip npm install by user.');
                return;
            }
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
        Logger.info('deploy job finished.');
    }
}
