#!/usr/bin/env node
import path from 'path';
import { program } from 'commander';
import ora from 'ora';
import chalk from 'chalk';

import output from 'madge/lib/output.js';
import { CircularChecker, pkg } from '../lib/index.js';

program
    .version(pkg.version)
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
    .option('--debug', 'turn on debug output', false);

/**
 * 获取 CLI 配置参数
 * @returns {OptionValues}
 */
const getOptions = () => {
    program.parse();
    const options = program.opts();

    if (program.args?.length < 1) {
        console.log(program.helpInformation());
        process.exit(1);
    }
    options.src = program.args[0];

    if (options.debug) {
        process.env.DEBUG = '*';
    }
    if (!options.color) {
        process.env.DEBUG_COLORS = false;
    }
    return options;
};

const dependencyFilter = (options) => {
    let prevFile;
    return (dependencyFilePath, traversedFilePath, baseDir) => {
        if (prevFile !== traversedFilePath) {
            const relPath = path.relative(baseDir, traversedFilePath);
            const dir = path.dirname(relPath) + '/';
            const file = path.basename(relPath);

            if (options.spinner) {
                spinner.text = chalk.grey(dir) + chalk.cyan(file);
                spinner.render();
            }
            prevFile = traversedFilePath;
        }
    };
};

/**
 * 生成循环依赖检查配置参数
 * @param options
 * @returns {{}}
 */
const getCheckConfig = (options) => {
    const config = {};
    if (options.basedir) {
        config.baseDir = options.basedir;
    }
    // 排除规则
    if (options.exclude) {
        config.excludeRegExp = [options.exclude];
    }
    // 扩展名
    if (options.extensions) {
        config.fileExtensions = options.extensions.split(',').map((s) => s.trim());
    }
    if (!options.json) {
        config.dependencyFilter = dependencyFilter(options);
    }
    return config;
};

const options = getOptions();

let spinner;
if (options.spinner && !options.json) {
    spinner = ora({
        text: 'Finding files',
        color: 'white',
        interval: 100000,
        isEnabled: options.spinner
    });
}

let exitCode = 0;
const startTime = Date.now();
try {
    spinner?.start();
    const checker = new CircularChecker(options.src, getCheckConfig(options));
    await checker.check();
    spinner?.stop();
    // 以 json 形式输出
    if (!options.json) {
        output.getResultSummary(checker.madge, startTime);
    }
    const circular = checker.circular() || [];
    spinner && output.circular(spinner, checker.madge, circular, {
        json: options.json
    });
    // 存在循环依赖
    if (circular.length > 0) {
        exitCode = 1;
    }
    // 绘制拓扑图
    if (options.image) {
        const imagePath = await checker.image(options.image);
        spinner?.succeed(`${ chalk.bold('Image created at') } ${ chalk.cyan.bold(imagePath) }`);
    }
    if (options.warning && !options.json) {
        output.warnings(checker.madge);
    }
    process.exit(exitCode);
} catch (err) {
    spinner?.stop();
    console.log('\n%s %s\n', chalk.red('✖'), err.stack);
    process.exit(1);
}
