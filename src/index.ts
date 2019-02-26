#!/usr/bin/env node
import { cli } from './cli';
import { logger } from './logger';

if (!module.parent) {
    cli.run((err: Error) => {
        if (err) {
            logger.error(err);
            return process.exit(1);
        }
        return process.exit(0);
    });
}
