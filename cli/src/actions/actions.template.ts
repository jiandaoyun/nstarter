import path from 'path';

import * as RepoActions from './actions.repository';


/**
 * 检查模板是否存在
 * @param repoTag - 仓库标签
 * @param tplTag - 模板标签
 */
export const isTemplateExists = async (repoTag: string, tplTag: string): Promise<boolean> => {
    const templates = await RepoActions.getRepoTemplates(repoTag);
    return templates.some((tpl) => tpl.template === tplTag);
};

/**
 * 获取模板路径
 * @param repoTag - 仓库标签
 * @param tplTag - 模板标签
 */
export const getTemplatePath = (repoTag: string, tplTag: string) => {
    const repoPath = RepoActions.getRepoPath(repoTag);
    return path.join(repoPath, 'templates', tplTag);
};
