import { promisify } from 'util';

export const sleep = async (timeMs: number) =>
    promisify(setTimeout)(timeMs);
