import fs from 'fs';

export const pkg = JSON.parse(
    fs.readFileSync('./package.json', 'utf-8')
);
