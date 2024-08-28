import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import { glob } from 'glob';
import { Logger } from 'nstarter-core';

import { gitCheckRepoVersion, gitCloneRepo, gitUpdateRepo } from './ops.git';
import { config } from '../config';
import { ALL_REPO_TAG, DEFAULT_REPO, DEFAULT_REPO_TAG } from '../constants';
import type { ITemplateConf } from '../types/cli';


/**
 * 获取指定仓库内模板列表
 * @param repoTag
 */
export const getRepoTemplates = async (repoTag: string) => {
    const repoPath = config.getRepoPath(repoTag);
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
    const tags = config.listRepoTags();
    const tplMap: { [tag: string]: ITemplateConf } = {}
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
export const listTemplates = async () => {
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
    const repoPath = config.getRepoPath(repoTag);
    if (fs.pathExistsSync(repoPath) && !_.isEmpty(fs.readdirSync(repoPath))) {
        Logger.debug('Using cached repository');
        return;
    }
    // 使用 git 拉取模板工程到本地工作目录
    Logger.info(`Cloning project template repository into "${ repoPath }"`);
    fs.ensureDirSync(config.workDir);
    // 选择模板
    let repoSrc = config.getRepoSource(repoTag);
    if (repoSrc) {
        Logger.info(`Using template repository "${ repoTag }" -> "${ repoSrc }"`);
    } else {
        Logger.warn(`Using default template repository "${ DEFAULT_REPO }"`);
        repoSrc = DEFAULT_REPO;
    }
    await gitCloneRepo(repoPath, repoSrc);
};

/**
 * 更新模板仓库
 * @param tag - 模板标签，默认值为 default
 */
export const updateRepo = async (tag = DEFAULT_REPO_TAG) => {
    const repoPath = config.getRepoPath(tag);
    if (!fs.pathExistsSync(repoPath) || _.isEmpty(fs.readdirSync(repoPath))) {
        Logger.warn('Could not find local repository cache, try to initialize.');
        await prepareRepo(tag);
        return;
    }
    // 验证是否最新
    const rev = await gitCheckRepoVersion(repoPath);
    if (rev) {
        Logger.info(`Repository "${ tag }" is up-to-date.`);
        return;
    }
    // 更新 repo
    Logger.info(`Update template repository "${ tag }" at "${ repoPath }"`);
    await gitUpdateRepo(repoPath);
};

/**
 * 删除指定标签模板仓库
 * @param tag - 模板仓库标签
 */
export const removeRepo = (tag: string) => {
    config.removeRepo(tag);
    clearRepoStorage(tag);
};

/**
 * 清空模板仓库存储
 * @param tag - 模板标签，默认值为 all
 */
export const clearRepoStorage = (tag = ALL_REPO_TAG) => {
    if (tag === ALL_REPO_TAG) {
        const repoDir = path.join(config.workDir, `repos/`);
        Logger.info(`Cleaning all template repository cache.`);
        fs.emptyDirSync(repoDir);
        return;
    }
    const repoPath = config.getRepoPath(tag);
    if (!fs.pathExistsSync(repoPath)) {
        return;
    }
    Logger.info(`Cleaning local template repository at "${ repoPath }"`);
    fs.emptyDirSync(repoPath);
    fs.rmdirSync(repoPath);
};
