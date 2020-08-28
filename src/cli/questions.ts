import _ from 'lodash';
import fs from 'fs-extra';
import { Question, Separator, ChoiceType } from 'inquirer';
import { DeployProject } from '../project';
import { DeployArguments } from './args';

export interface DeployConf {
    readonly name: string;
    readonly workdir: string;
    readonly modules: string[];
    readonly confirm: boolean;
}

export interface NpmInstallConf {
    readonly npm: boolean;
}

/**
 *
 * @param args
 * @param project
 */
export function getDeployQuestions(args: DeployArguments, project: DeployProject): Question[] {
    const moduleChoices: ChoiceType[] = [];
    const moduleLabelMap: Record<string, string> = {};
    const moduleDependencyMap: Record<string, string[]> = {};
    _.forEach(project.moduleGroups, (group) => {
        // Add separator
        if (!_.isEmpty(group.modules)) {
            moduleChoices.push(new Separator(`- ${ group.label }`));
        }
        _.forEach(group.modules, (module) => {
            // Add module choice
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
        type: 'input',
        name: 'workdir',
        message: 'Project path:',
        default: (answers: DeployConf) => {
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
        type: 'checkbox',
        name: 'modules',
        message: 'Select modules:',
        pageSize: _.size(moduleChoices),
        choices: moduleChoices,
        validate: (selected: string[]) => {
            let check: boolean | string = true;
            if (_.isEmpty(moduleDependencyMap)) {
                return check;
            }
            const selectedSet = new Set(selected);
            _.forEach(selected, (name) => {
                const moduleDependency = moduleDependencyMap[name];
                if (!moduleDependency) {
                    return;
                }
                _.forEach(moduleDependency, (dependent) => {
                    if (!selectedSet.has(dependent)) {
                        check = `Module "${ moduleLabelMap[name] }" depends on "${ moduleLabelMap[dependent] }".`;
                        return false;
                    }
                    return;
                });
            });
            return check;
        }
    },
        {
            type: 'confirm',
            name: 'confirm',
            message: 'Confirm initialized now?',
            default: false
        }];
}

export const npmInstallQuestions = [{
    type: 'confirm',
    name: 'npm',
    message: 'Install npm packages now?',
    default: true
}];
