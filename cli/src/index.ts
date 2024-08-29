#!/usr/bin/env node
import { Logger } from 'nstarter-core';
import { runCli } from './cli';
import { initLogger } from './logger';

try {
    initLogger();
    runCli();
} catch (err) {
    if (err) {
        if (err instanceof Error) {
            Logger.error(err.message);
            err.stack && Logger.error(err.stack);
        }
        process.exit(1);
    }
    process.exit(0);
}
