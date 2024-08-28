import type { QuestionCollection } from 'inquirer';
import { Logger } from 'nstarter-core';

import type { IDeployArguments } from '../cli';
import { GitActions, RepoActions } from '../actions';
import { prompt } from './prompt';


/**
 * 获取模板更新确认交互问题
 * @param args
 */
const getRepoUpdateQuestions = (args: IDeployArguments): QuestionCollection =>
    [{
        type: 'confirm',
        name: 'update',
        message: 'Update repository cache now?',
        when: !args.yes,
        default: false
    }];

/**
 * 准备模板仓库
 * @param args
 */
export const promptRepoPrepare = async (args: IDeployArguments): Promise<void> => {
    const repoTag = args.repo!;
    await RepoActions.prepareRepo(repoTag);
    // 检查是否需要更新
    const rev = await GitActions.checkRepoVersion(RepoActions.getRepoPath(repoTag));
    if (!rev) {
        Logger.warn(`Repository "${ repoTag }" is not up-to-date.`);
        const answers = await prompt(getRepoUpdateQuestions(args));
        if (answers.update) {
            await RepoActions.updateRepo(repoTag);
        }
    } else {
        Logger.debug(`Repository "${ repoTag }" is up-to-date.`);
    }
};
