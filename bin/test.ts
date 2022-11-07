/**
 * Copyright (c) 2015-2023, FineX, All Rights Reserved.
 * @author vista@fanruan.com
 * @date 2022/10/15
 */

import { assert } from '@japa/assert';
import { runFailedTests } from '@japa/run-failed-tests';
import { configure, PluginFn, processCliArgs, run, TestContext } from '@japa/runner';
import { specReporter } from '@japa/spec-reporter';
import Redis from 'ioredis';
import { init } from '../src';

const files: string[] = [];
const plugins: PluginFn[] = [];

if (!process.env.CI) {
    files.push('test/**/*.test.ts');
    plugins.push(runFailedTests());
    const redis = new Redis();
    init(redis);
    TestContext.macro('isCI', () => false);
    TestContext.getter('ownerId', () => redis);
} else {
    TestContext.macro('isCI', () => true);
}

configure({
    ...processCliArgs(process.argv.slice(2)),
    ...{
        files,
        plugins: [assert(), runFailedTests()],
        reporters: [specReporter()],
        importer: (filePath) => import(filePath),
        forceExit: true
    }
});

async function main(): Promise<void> {
    await run();
}

main();
