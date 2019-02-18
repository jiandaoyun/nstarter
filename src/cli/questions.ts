import _ from 'lodash';
import fs from 'fs';
import moment from 'moment-timezone';
import { Question, Separator, ChoiceType } from 'inquirer';
import { project } from '../project';

export interface DeployConf {
    readonly name?: string;
    readonly path?: string;
    readonly timezone?: string;
    readonly modules?: string[];
    readonly confirm?: boolean;
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

export const questions: Question[] = [
    {
        type: 'input',
        name: 'name',
        message: 'Name of application:',
        validate: (name) => {
            if (_.isEmpty(name)) {
                return 'Name should not be empty';
            }
            return true;
        }
    },
    {
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
                return "Work directory should not be empty.";
            }
            if (!fs.existsSync(path)) {
                return true;
            }
            if (!_.isEmpty(fs.readdirSync(path))) {
                return `"${ path }" is not an empty directory.`;
            }
            return true;
        }
    },
    {
        type: 'input',
        name: 'timezone',
        message: 'Default timezone:',
        default: moment.tz.guess(),
        validate: (timezone) => {
            if (!moment.tz.zone(timezone)) {
                return `'${ timezone }' is not a valid timezone.`
            }
            return true;
        }
    },
    {
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
    }
];
