#!/usr/bin/env node
import { cli } from './cli';
import { logger } from './logger';

if (!module.parent) {
    try {
        cli.run();
    } catch (err) {
        if (err) {
            logger.error(err);
            process.exit(1);
        }
        process.exit(0);
    }
}
