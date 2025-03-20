import fs from 'fs';
import * as path from 'path';

const loadPkg = (pkgPath: string) => {
    return JSON.parse(
        fs.readFileSync(pkgPath, 'utf-8')
    );
};

let pkgPath = path.join(__dirname, '../package.json');
let pkg: any;
if (fs.existsSync(pkgPath)) {
    pkg = loadPkg(pkgPath);
} else {
    pkgPath = path.join(__dirname, '../../package.json');
    pkg = loadPkg(pkgPath);
}

export {
    pkg
};
