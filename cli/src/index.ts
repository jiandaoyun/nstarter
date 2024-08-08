#!/usr/bin/env node --no-warnings --import=extensionless/register
import { Logger } from 'nstarter-core';
import { runCli } from './cli';
import { initLogger } from './logger';

try {
    initLogger();
    runCli();
} catch (err) {
    if (err) {
        Logger.error((err as Error).message);
        process.exit(1);
    }
    process.exit(0);
}
