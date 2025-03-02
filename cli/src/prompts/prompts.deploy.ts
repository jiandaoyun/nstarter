import _ from 'lodash';
import fs from 'fs-extra';
import type { ChoiceCollection, QuestionCollection } from 'inquirer';
import inquirer from 'inquirer';

import type { ProjectInstaller } from '../installer';
import type { IDeployArguments, IDeployConf, INpmInstallConf } from '../cli';
import { prompt } from './prompt';

/**
 * 生成部署交互问题
 * @param args
 * @param project
 */
const getDeployQuestions = (args: IDeployArguments, project: ProjectInstaller): QuestionCollection => {
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
const npmInstallQuestions = [{
    // 确认执行 npm 初始化
    type: 'confirm',
    name: 'npm',
    message: 'Install npm packages now?',
    default: true
}];


/**
 * 生成部署交互问题
 * @param args
 * @param project
 */
export const promptProjectDeploy = async (args: IDeployArguments, project: ProjectInstaller): Promise<IDeployConf> => {
    const answers = await prompt(getDeployQuestions(args, project)) as IDeployConf;
    return {
        ...answers,
        name: args.name!,
        workdir: args.target!
    };
};

/**
 * 确认是否需要安装 npm
 */
export const promptNpmInstall = async () => {
    return await prompt(npmInstallQuestions) as INpmInstallConf;
};
