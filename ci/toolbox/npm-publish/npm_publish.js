#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

const checkRegistryVersion = (pkgName) => {
    const cmd = `npm view ${ pkgName } version`;
    let version;
    try {
        version = execSync(cmd, {
            timeout: 5000
        }).toString().trim();
    } catch (err) {
        if (err.code === 'ETIMEDOUT') {
            throw new Error('npm registry timeout.');
        } else if (/npm error code E404/.test(err.message)) {
            // 首次发布默认版本
            return '0.0.0';
        } else {
            throw err;
        }
    }
    return version;
};

const publishPackage = (pkgDir) => {
    execSync('npm publish', {
        cwd: pkgDir,
        stdio: 'inherit'
    });
};


const runCli = () => {
    const args = process.argv.slice(2);
    const pkgDir = args[0];

    if (!pkgDir) {
        console.error('Invalid package directory.');
        process.exit(1);
    }

    const pkgPath = path.join(pkgDir, './package.json');
    const pkg = JSON.parse(
        fs.readFileSync(pkgPath, 'utf-8')
    );

    console.log('-'.repeat(30));

    const regVersion = checkRegistryVersion(pkg.name);
    // 检查并发布新版本
    if (semver.gt(pkg.version, regVersion)) {
        console.log(`publish [${ pkg.name }] -> ${ pkg.version }`);
        publishPackage(pkgDir);
    } else {
        console.log(`package [${ pkg.name }] already at ${ regVersion }(>= ${ pkg.version })`);
    }
    process.exit(0);
};

if (require.main === module) {
    try {
        runCli();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
