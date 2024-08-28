import _ from 'lodash';
import { Logger } from 'nstarter-core';
import type { QuestionCollection } from 'inquirer';

import type { IDeployArguments, ITemplateConf } from '../cli';
import { DEFAULT_REPO_TAG } from '../constants';
import { RepoActions, TemplateActions } from '../actions';
import { prompt } from './prompt';

/**
 * 获取模板选择交互问题
 */
const getTemplateQuestions = (): QuestionCollection =>
    [{
        name: 'repo',
        type: 'list',
        message: 'Template repository:',
        default: DEFAULT_REPO_TAG,
        when: RepoActions.listRepoTags().length > 1,
        choices: RepoActions.listRepoTags(),
        validate: (tag: string) => RepoActions.isRepoExisted(tag)
    }, {
        name: 'template',
        type: 'list',
        message: 'Template to use:',
        default: '',
        choices: async (answers) => {
            const templates = await RepoActions.getRepoTemplates(answers.repo || DEFAULT_REPO_TAG);
            return _.map(templates, (tpl) => ({
                name: `${ tpl.template } (${ tpl.repo })`,
                value: tpl.template
            }));
        },
        validate: async (tag: string, answers: ITemplateConf) =>
            TemplateActions.isTemplateExists(answers.repo || DEFAULT_REPO_TAG, tag)
    }];


/**
 * 模板选择
 * @param args
 * @param prompt
 */
export const promptTemplateSelect = async (args: IDeployArguments): Promise<ITemplateConf> => {
    let repoTag = args.repo!;
    let tplTag = args.template;
    if (tplTag && !await TemplateActions.isTemplateExists(repoTag, tplTag)) {
        Logger.warn(`Could not find template "${ tplTag } (${ repoTag })".`);
        tplTag = undefined;
    }
    if (!tplTag) {
        const answers = await prompt(getTemplateQuestions()) as ITemplateConf;
        repoTag = answers.repo || DEFAULT_REPO_TAG;
        tplTag = answers.template;
    }
    return {
        repo: repoTag,
        template: tplTag
    };
};
