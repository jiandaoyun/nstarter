#!/usr/bin/env node
'use strict';

const path = require('path');
const process = require('process');
const program = require('commander');
const ora = require('ora');
const chalk = require('chalk');
const output = require('madge/lib/output');

const version = require('../package.json').version;
const Checker = require('../lib/checker');

const startTime = Date.now();

program
    .version(version)
    .usage('[options] <src...>')
    .option('-b, --basedir <path>', 'base directory for resolving paths')
    .option('-x, --exclude <regexp>', 'exclude modules using RegExp')
    .option('-j, --json', 'output as JSON')
    .option('-i, --image <file>', 'write graph to file as an image')
    .option('-l, --layout <name>', 'layout engine to use for graph (dot/neato/fdp/sfdp/twopi/circo)')
    .option('--extensions <list>', 'comma separated string of valid file extensions')
    .option('--no-color', 'disable color in output and image', false)
    .option('--no-spinner', 'disable progress spinner', false)
    .option('--warning', 'show warnings about skipped files', false)
    .option('--debug', 'turn on debug output', false)
    .parse(process.argv);

if (!program.args.length) {
    console.log(program.helpInformation());
    process.exit(1);
}

if (program.debug) {
    process.env.DEBUG = '*';
}

if (!program.color) {
    process.env.DEBUG_COLORS = false;
}

const config = {};

program.options.forEach((opt) => {
    const name = opt.name();

    if (program[name]) {
        config[name] = program[name];
    }
});

const spinner = ora({
    text: 'Finding files',
    color: 'white',
    interval: 100000,
    isEnabled: program.spinner
});

let exitCode = 0;

if (program.basedir) {
    config.baseDir = program.basedir;
}

if (program.exclude) {
    config.excludeRegExp = [program.exclude];
}

if (program.extensions) {
    config.fileExtensions = program.extensions.split(',').map((s) => s.trim());
}

function dependencyFilter() {
    let prevFile;

    return (dependencyFilePath, traversedFilePath, baseDir) => {
        if (prevFile !== traversedFilePath) {
            const relPath = path.relative(baseDir, traversedFilePath);
            const dir = path.dirname(relPath) + '/';
            const file = path.basename(relPath);

            if (program.spinner) {
                spinner.text = chalk.grey(dir) + chalk.cyan(file);
                spinner.render();
            }
            prevFile = traversedFilePath;
        }
    };
}

new Promise((resolve, reject) => {
    resolve(program.args);
})
    .then((src) => {
        if (!program.json && !program.dot) {
            spinner.start();
            config.dependencyFilter = dependencyFilter();
        }

        return new Checker(src, config);
    })
    .then((checker) => {
        if (!program.json && !program.dot) {
            spinner.stop();
            output.getResultSummary(checker.madge, startTime);
        }

        const circular = checker.circular() || [];
        output.circular(spinner, checker.madge, circular, {
            json: program.json
        });

        if (circular.length) {
            exitCode = 1;
        }

        if (program.image) {
            return checker.image(program.image).then((imagePath) => {
                spinner.succeed(`${chalk.bold('Image created at')} ${chalk.cyan.bold(imagePath)}`);
                return checker;
            });
        }

        return checker;
    })
    .then((checker) => {
        if (program.warning && !program.json) {
            output.warnings(checker.madge);
        }

        process.exit(exitCode);
    })
    .catch((err) => {
        spinner.stop();
        console.log('\n%s %s\n', chalk.red('✖'), err.stack);
        process.exit(1);
    });
