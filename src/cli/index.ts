import { createPromptModule } from 'inquirer';
import { questions } from './questions';

export const prompt = createPromptModule();
prompt(questions).then((answers) => {
    console.log(answers);
    process.exit(0);
});
