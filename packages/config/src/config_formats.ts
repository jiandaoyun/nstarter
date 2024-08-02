import type { IFormat } from 'nconf';
import nconf from 'nconf';
import { dump, load } from 'js-yaml';

const yamlFormat: IFormat = {
    parse: (str: string) => load(str),
    stringify: (obj: object) => dump(obj)
};

/**
 * 配置结构解析定义
 */
export const configFormats: Record<string, IFormat> = {
    yaml: yamlFormat,
    yml: yamlFormat,
    json: nconf.formats.json
};
