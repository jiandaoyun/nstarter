import _ from 'lodash';
import fs from 'fs';
import { Question, Separator, ChoiceType } from 'inquirer';
import { project } from '../project';
import { ArgumentConf } from './args';

export interface DeployConf {
    readonly name: string;
    readonly workdir: string;
    readonly modules: string[];
    readonly confirm: boolean;
}

export interface NpmInstallConf {
    readonly npm: string;
}

const moduleChoices: ChoiceType[] = [];
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
    });
});

export function getDeployQuestions(args: ArgumentConf) {
    const questions: Question[] = [];
    if (!args.name) {
        questions.push({
            type: 'input',
            name: 'name',
            message: 'Name of application:',
            validate: (name) => {
                if (_.isEmpty(name)) {
                    return 'Name should not be empty';
                }
                return true;
            }
        });
    }
    if (!args.target) {
        questions.push({
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
            validate: (path: string) => {
                if (_.isEmpty(path)) {
                    return "param should not be empty.";
                }
                if (!fs.existsSync(path)) {
                    return true;
                }
                if (!_.isEmpty(fs.readdirSync(path))) {
                    return `"${ path }" is not empty.`;
                }
                return true;
            }
        });
    }
    questions.push({
        type: 'checkbox',
        name: 'modules',
        message: 'Select modules:',
        pageSize: _.size(moduleChoices),
        choices: moduleChoices
    },
    {
        type: 'confirm',
        name: 'confirm',
        message: 'Confirm initialized now?',
        default: false
    });
    return questions;
}

export const npmInstallQuestions = [{
    type: 'confirm',
    name: 'npm',
    message: 'Install npm packages now?',
    default: true
}];
