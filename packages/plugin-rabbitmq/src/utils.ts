import { promisify } from 'util';

/**
 * 等待执行
 * @param timeMs
 */
export const sleep = async (timeMs: number) => {
    return promisify(setTimeout)(timeMs);
};
