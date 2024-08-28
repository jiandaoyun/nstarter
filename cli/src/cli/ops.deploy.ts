import _ from 'lodash';
import { promisify } from 'util';
import type { PromptModule } from 'inquirer';
import { createPromptModule } from 'inquirer';
import { Logger } from 'nstarter-core';

import { getDeployQuestions, getTemplateQuestions, getRepoUpdateQuestions, npmInstallQuestions } from './questions';
import { ProjectInstaller } from '../installer';
import type { IDeployArguments, IDeployConf, INpmInstallConf, ITemplateConf } from '../types/cli';
import { prepareRepo, updateRepo } from './ops.repository';
import { gitCheckRepoVersion } from './ops.git';
import { config } from '../config';
import { isTemplateExists } from './ops.template';
import { DEFAULT_REPO_TAG } from '../constants';


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
        let repoTag = this._args.repo!;
        let templateTag = this._args.template;
        if (templateTag && !await isTemplateExists(repoTag, templateTag)) {
            Logger.warn(`Could not find template "${ templateTag } (${ repoTag })".`);
            templateTag = undefined;
        }
        if (!templateTag) {
            const answers = await this._prompt(getTemplateQuestions(this._args)) as ITemplateConf;
            repoTag = answers.repo || DEFAULT_REPO_TAG;
            templateTag = answers.template;
        }
        await prepareRepo(repoTag);
        // 检查是否需要更新
        const rev = await gitCheckRepoVersion(config.getRepoPath(repoTag));
        if (!rev) {
            Logger.warn(`Repository "${ repoTag }" is not up-to-date.`);
            const answers = await this._prompt(getRepoUpdateQuestions(this._args));
            if (answers.update) {
                await updateRepo(repoTag);
            }
        } else {
            Logger.debug(`Repository "${ repoTag }" is up-to-date.`);
        }
        this._project = new ProjectInstaller(repoTag, templateTag);
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
