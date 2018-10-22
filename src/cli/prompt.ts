import * as _ from 'lodash';
import * as moment from 'moment-timezone';
import { createPromptModule, Question } from 'inquirer';

const prompt = createPromptModule();
const questions: Question[] = [];

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

questions.push({
    type: 'input',
    name: 'workdir',
    message: 'Project path:',
    default: './'
});

questions.push({
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
});

questions.push({
    type: 'checkbox',
    name: 'services',
    message: 'Select services:',
    choices: [
        { name: 'Database: Mongodb', value: 'mongodb', checked: true },
        { name: 'Database: Redis', value: 'redis', checked: true },
        { name: 'Service: Websocket', value: 'websocket', checked: true },
        { name: 'Service: CronJob', value: 'agenda', checked: false },
        { name: 'Service: i18n', value: 'i18n', checked: false },
        { name: 'Tracking: Sentry', value: 'sentry', checked: false }
    ]
});

questions.push({
    type: 'confirm',
    name: 'confirm',
    message: 'Confirm initialized now?',
    default: true
});

prompt(questions).then((answers) => {
    console.log(answers);
    process.exit(0);
});
