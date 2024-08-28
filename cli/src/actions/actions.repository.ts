import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import { glob } from 'glob';
import { Logger } from 'nstarter-core';

import * as GitActions from './actions.git';
import { config } from '../config';
import { ALL_REPO_TAG, DEFAULT_REPO, DEFAULT_REPO_TAG } from '../constants';
import type { ITemplateConf } from '../cli';


/**
 * 获取模板仓库地址
 * @param repoTag - 仓库标签
 */
export const getRepoSource = (repoTag = DEFAULT_REPO_TAG): string | null => {
    return config.getConfig().repos[repoTag];
};

/**
 * 获取模板仓库标签
 */
export const listRepoTags = (): string[] => {
    return Object.keys(config.getConfig().repos);
};

/**
 * 检查模板是否已配置
 * @param repoTag - 仓库标签
 */
export const isRepoExisted = (repoTag: string): boolean => {
    return !_.isEmpty(config.getConfig().repos[repoTag]);
};

/**
 * 获取模板仓库工作目录路径
 * @param repoTag - 仓库标签
 */
export const getRepoPath = (repoTag: string): string => {
    return path.join(config.workDir, `repos/${ repoTag }`);
};


/**
 * 获取指定仓库内模板列表
 * @param repoTag
 */
export const getRepoTemplates = async (repoTag: string) => {
    const repoPath = getRepoPath(repoTag);
    const search = await glob(`${ path.join(repoPath, 'templates') }/*/.ns_template/module.conf.yml`, {
        mark: true,
        dot: true,
    });
    const templates: ITemplateConf[] = [];
    for (const file of search) {
        const pathMatch = file.replaceAll(path.sep, '/')
            .match(/(?<repo>[\w\-_]+)\/templates\/(?<template>[\w\-_]+)\/\.ns_template\/module\.conf\.ya?ml$/);
        templates.push({
            repo: pathMatch!.groups!.repo,
            template: pathMatch!.groups!.template,
        });
    }
    return templates;
};

/**
 * 获取所有仓库中的所有模板
 */
export const getAllTemplates = async () => {
    const tags = listRepoTags();
    const tplMap: { [tag: string]: ITemplateConf } = {};
    for (const tag of tags) {
        const templates = await getRepoTemplates(tag);
        for (const tpl of templates) {
            if (!tplMap[tpl.template]) {
                tplMap[tpl.template] = tpl;
            }
        }
    }
    return tplMap;
};

/**
 * 获取所有仓库中的所有模板
 */
export const printTemplates = async () => {
    const templates = await getAllTemplates();
    for (const tpl of Object.keys(templates)) {
        console.log(`${ tpl } (${ templates[tpl].repo })`);
    }
};

/**
 * 初始化模板工程仓库
 * @param repoTag - 仓库标签，默认值为 default
 */
export const prepareRepo = async (repoTag = DEFAULT_REPO_TAG) => {
    const repoPath = getRepoPath(repoTag);
    if (fs.pathExistsSync(repoPath) && !_.isEmpty(fs.readdirSync(repoPath))) {
        Logger.debug('Using cached repository');
        return;
    }
    // 使用 git 拉取模板工程到本地工作目录
    Logger.info(`Cloning project template repository into "${ repoPath }"`);
    fs.ensureDirSync(config.workDir);
    // 选择模板
    let repoSrc = getRepoSource(repoTag);
    if (repoSrc) {
        Logger.info(`Using template repository "${ repoTag }" -> "${ repoSrc }"`);
    } else {
        Logger.warn(`Using default template repository "${ DEFAULT_REPO }"`);
        repoSrc = DEFAULT_REPO;
    }
    await GitActions.cloneRepo(repoPath, repoSrc);
};

/**
 * 更新模板仓库
 * @param repoTag - 仓库标签，默认值为 default
 */
export const updateRepo = async (repoTag = DEFAULT_REPO_TAG) => {
    const repoPath = getRepoPath(repoTag);
    if (!fs.pathExistsSync(repoPath) || _.isEmpty(fs.readdirSync(repoPath))) {
        Logger.warn('Could not find local repository cache, try to initialize.');
        await prepareRepo(repoTag);
        return;
    }
    // 验证是否最新
    const rev = await GitActions.checkRepoVersion(repoPath);
    if (rev) {
        Logger.info(`Repository "${ repoTag }" is up-to-date.`);
        return;
    }
    // 更新 repo
    Logger.info(`Update template repository "${ repoTag }" at "${ repoPath }"`);
    await GitActions.updateRepo(repoPath);
};

/**
 * 删除指定标签模板仓库
 * @param repoTag - 模板仓库标签
 */
export const removeRepo = (repoTag: string) => {
    config.removeRepo(repoTag);
    clearRepoStorage(repoTag);
};

/**
 * 清空模板仓库存储
 * @param repoTag - 模板标签，默认值为 all
 */
export const clearRepoStorage = (repoTag = ALL_REPO_TAG) => {
    if (repoTag === ALL_REPO_TAG) {
        const repoDir = path.join(config.workDir, `repos/`);
        Logger.info(`Cleaning all template repository cache.`);
        fs.emptyDirSync(repoDir);
        return;
    }
    const repoPath = getRepoPath(repoTag);
    if (!fs.pathExistsSync(repoPath)) {
        return;
    }
    Logger.info(`Cleaning local template repository at "${ repoPath }"`);
    fs.emptyDirSync(repoPath);
    fs.rmdirSync(repoPath);
};
