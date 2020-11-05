#!/usr/bin/env node
import { runCli } from './cli';
import { logger } from './logger';

if (!module.parent) {
    try {
        runCli();
    } catch (err) {
        if (err) {
            logger.error(err);
            process.exit(1);
        }
        process.exit(0);
    }
}
