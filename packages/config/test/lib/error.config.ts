import { IConfig } from '../../src';

/**
 * 异常配置
 */
export class ErrorConfig implements IConfig {
    public fromJSON(obj: any): void {
        throw new Error('bad config');
    }
}
