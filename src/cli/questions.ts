import _ from 'lodash';
import fs from 'fs-extra';
import { Question, Separator, ChoiceType } from 'inquirer';
import { ProjectInstaller } from '../installer';
import { IDeployArguments, IDeployConf } from '../types/cli';
import { config } from '../config';
import { DEFAULT_TEMPLATE_TAG } from '../constants';

/**
 * 获取模板选择交互问题
 * @param args
 */
export const getTemplateQuestions = (args: IDeployArguments): Question[] =>
    [{
        name: 'template',
        type: 'list',
        message: 'Template to use:',
        default: DEFAULT_TEMPLATE_TAG,
        when: !args.template || !config.isTemplateExisted(args.template),
        choices: config.listTemplateTags(),
        validate: (tag: string) => config.isTemplateExisted(tag)
    }];

/**
 * 获取模板更新确认交互问题
 * @param args
 */
export const getTemplateUpdateQuestions = (args: IDeployArguments): Question[] =>
    [{
        type: 'confirm',
        name: 'update',
        message: 'Update template cache now?',
        when: !args.yes,
        default: false
    }];

/**
 * 生成部署交互问题
 * @param args
 * @param project
 */
export const getDeployQuestions = (args: IDeployArguments, project: ProjectInstaller): Question[] => {
    const moduleChoices: ChoiceType[] = [];
    const moduleLabelMap: Record<string, string> = {};
    const moduleDependencyMap: Record<string, string[]> = {};
    _.forEach(project.moduleGroups, (group) => {
        // 模块分隔符
        if (!_.isEmpty(group.modules)) {
            moduleChoices.push(new Separator(`- ${ group.label }`));
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
        when: _.size(moduleChoices) > 0,
        pageSize: _.size(moduleChoices),
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
