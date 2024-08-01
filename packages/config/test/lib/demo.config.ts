import { IConfig } from '../../src';

/**
 * 测试示例配置
 */
export class DemoConfig implements IConfig {
    system: {
        locale: string,
        timezone: string
    };
    includes?: string[];

    public fromJSON(obj: any): void {
        Object.assign(this, obj);
    }
}
