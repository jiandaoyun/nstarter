import url from 'url';
import fs from 'fs-extra';
import path from 'path';

const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
export const pkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);
