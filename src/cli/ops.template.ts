import _ from 'lodash';
import path from "path";
import fs from 'fs-extra';

import { gitCheckTemplateVersion, gitCloneTemplate, gitUpdateTemplate } from './ops.git';
import { config } from '../config';
import { logger } from '../logger';
import { ALL_TEMPLATE_TAG, DEFAULT_TEMPLATE, DEFAULT_TEMPLATE_TAG } from '../constants';

/**
 * 获取当前模板状态
 */
export const listTemplates = () => {
    const tags = config.listTemplateTags();
    if (_.isEmpty(tags)) {
        logger.warn('No templates has been configured.');
        return;
    }
    for (const tag of tags) {
        const template = config.getTemplate(tag);
        console.log(`${ tag } -> ${ template }`);
    }
};

/**
 * 初始化模板工程
 * @param tag - 模板标签，默认值为 default
 */
export const prepareTemplate = async (tag = DEFAULT_TEMPLATE_TAG) => {
    const templatePath = config.getTemplatePath(tag);
    if (fs.pathExistsSync(templatePath) && !_.isEmpty(fs.readdirSync(templatePath))) {
        logger.debug('Using cached template');
        return;
    }
    // 使用 git 拉取模板工程到本地工作目录
    logger.info(`Cloning project template into "${ templatePath }"`);
    fs.ensureDirSync(config.workDir);
    // 选择模板
    let template = config.getTemplate(tag);
    if (template) {
        logger.info(`Using template "${ tag }" -> "${ template }"`);
    } else {
        logger.warn(`Using default template "${ DEFAULT_TEMPLATE }"`);
        template = DEFAULT_TEMPLATE;
    }
    await gitCloneTemplate(templatePath, template);
};

/**
 * 更新模板工程
 * @param tag - 模板标签，默认值为 default
 */
export const updateTemplate = async (tag = DEFAULT_TEMPLATE_TAG) => {
    const templatePath = config.getTemplatePath(tag);
    if (!fs.pathExistsSync(templatePath) || _.isEmpty(fs.readdirSync(templatePath))) {
        logger.error('Could not find local template cache');
        return;
    }
    // 验证是否最新
    const rev = await gitCheckTemplateVersion(templatePath);
    if (rev) {
        logger.info(`Template "${ tag }" is up-to-date.`);
        return;
    }
    // 更新 repo
    logger.info(`Update project template "${ tag }" at "${ templatePath }"`);
    await gitUpdateTemplate(templatePath);
};

/**
 * 删除模板工程
 * @param tag - 删除模板工程
 */
export const removeTemplate = (tag: string) => {
    config.removeTemplate(tag);
    clearTemplate(tag);
};

/**
 * 清空模板工程
 * @param tag - 模板标签，默认值为 all
 */
export const clearTemplate = (tag = ALL_TEMPLATE_TAG) => {
    if (tag === ALL_TEMPLATE_TAG) {
        const templateDir = path.join(config.workDir, `templates/`);
        logger.info(`Cleaning all templates cache.`);
        fs.emptyDirSync(templateDir);
        return;
    }
    const templatePath = config.getTemplatePath(tag);
    if (!fs.pathExistsSync(templatePath)) {
        return;
    }
    logger.info(`Cleaning local template at "${ templatePath }"`);
    fs.emptyDirSync(templatePath);
    fs.rmdirSync(templatePath);
};
