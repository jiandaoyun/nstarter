import _ from 'lodash';
import fs from 'fs-extra';
import type { ChoiceCollection, QuestionCollection } from 'inquirer';
import inquirer from 'inquirer';
import type { ProjectInstaller } from '../installer';
import type { IDeployArguments, IDeployConf, ITemplateConf } from '../types/cli';
import { config } from '../config';
import { DEFAULT_REPO_TAG } from '../constants';
import { getRepoTemplates } from './ops.repository';
import { isTemplateExists } from './ops.template';

/**
 * 获取模板选择交互问题
 * @param args
 */
export const getTemplateQuestions = (args: IDeployArguments): QuestionCollection =>
    [{
        name: 'repo',
        type: 'list',
        message: 'Template repository:',
        default: DEFAULT_REPO_TAG,
        when: config.listRepoTags().length > 1,
        choices: config.listRepoTags(),
        validate: (tag: string) => config.isRepoExisted(tag)
    }, {
        name: 'template',
        type: 'list',
        message: 'Template to use:',
        default: '',
        choices: async (answers) => {
            const templates = await getRepoTemplates(answers.repo || DEFAULT_REPO_TAG);
            return _.map(templates, (tpl) => ({
                name: `${ tpl.template } (${ tpl.repo })`,
                value: tpl.template
            }));
        },
        validate: async (tag: string, answers: ITemplateConf) =>
            isTemplateExists(answers.repo || DEFAULT_REPO_TAG, tag)
    }];

/**
 * 获取模板更新确认交互问题
 * @param args
 */
export const getRepoUpdateQuestions = (args: IDeployArguments): QuestionCollection =>
    [{
        type: 'confirm',
        name: 'update',
        message: 'Update repository cache now?',
        when: !args.yes,
        default: false
    }];

/**
 * 生成部署交互问题
 * @param args
 * @param project
 */
export const getDeployQuestions = (args: IDeployArguments, project: ProjectInstaller): QuestionCollection => {
    const moduleChoices: ChoiceCollection = [];
    const moduleLabelMap: Record<string, string> = {};
    const moduleDependencyMap: Record<string, string[]> = {};
    _.forEach(project.moduleGroups, (group) => {
        // 模块分隔符
        if (!_.isEmpty(group.modules)) {
            moduleChoices.push(new inquirer.Separator(`- ${ group.label }`));
        }
        _.forEach(group.modules, (module) => {
            // 读取并增加模块选项
            moduleChoices.push({
                name: module.label,
                value: module.name,
                checked: module.default
            });
            moduleLabelMap[module.name] = module.label;
            if (!_.isEmpty(module.dependencies)) {
                moduleDependencyMap[module.name] = module.dependencies;
            }
        });
    });

    return [{
        // 设定项目名称
        type: 'input',
        name: 'name',
        message: 'Name of application:',
        when: !args.name,
        validate: (name) => {
            if (_.isEmpty(name)) {
                return 'Name should not be empty';
            }
            return true;
        }
    }, {
        // 设定工程部署目录
        type: 'input',
        name: 'workdir',
        message: 'Project path:',
        default: (answers: IDeployConf) => {
            let path = './';
            if (!_.isEmpty(fs.readdirSync(path))) {
                path += answers.name || '';
            }
            return path;
        },
        when: !args.target,
        validate: (path: string) => {
            if (_.isEmpty(path)) {
                return 'param should not be empty.';
            }
            if (!fs.pathExistsSync(path)) {
                return true;
            }
            if (!_.isEmpty(fs.readdirSync(path))) {
                return `"${ path }" is not empty.`;
            }
            return true;
        }
    }, {
        // 选择选装模块组件
        type: 'checkbox',
        name: 'modules',
        message: 'Select modules:',
        when: moduleChoices.length > 0,
        pageSize: moduleChoices.length,
        choices: moduleChoices,
        validate: (selected: string[]) => {
            // 模块依赖校验
            let check: boolean | string = true;
            if (_.isEmpty(moduleDependencyMap)) {
                return check;
            }
            const selectedSet = new Set(selected);
            _.forEach(selected, (name) => {
                const moduleDependency = moduleDependencyMap[name];
                if (!moduleDependency) {
                    return true;
                }
                _.forEach(moduleDependency, (dependent) => {
                    if (!selectedSet.has(dependent)) {
                        check = `Module "${ moduleLabelMap[name] }" depends on "${ moduleLabelMap[dependent] }".`;
                        return false;
                    }
                    return;
                });
                return !_.isString(check);

            });
            return check;
        }
    }, {
        // 确认执行安装
        type: 'confirm',
        name: 'confirm',
        message: 'Confirm initialized now?',
        when: !args.yes,
        default: false
    }];
};

/**
 * npm 安装初始化提示选项
 */
export const npmInstallQuestions = [{
    // 确认执行 npm 初始化
    type: 'confirm',
    name: 'npm',
    message: 'Install npm packages now?',
    default: true
}];
