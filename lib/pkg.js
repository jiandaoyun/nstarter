import fs from 'fs';
import { posix as path } from 'path';
import * as url from 'url';
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

export const pkg = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);
