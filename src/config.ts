import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import { logger } from './logger';
import { DEFAULT_TEMPLATE_TAG } from './constants';

interface IToolConf {
    template: {
        [key: string]: string | null
    };
}

type configKey = string | undefined;
type configValue = string | undefined;

/**
 * 工具配置管理
 */
export class ToolConfig {
    private readonly _confName = 'config.json';
    private readonly _confFile: string;
    private readonly _conf: IToolConf = {
        template: {}
    };

    /**
     * @param confPath - 配置文件路径
     * @constructor
     */
    constructor(confPath = './') {
        fs.ensureDirSync(confPath);
        this._confFile = path.join(confPath, this._confName);

        // 初始化配置
        if (fs.pathExistsSync(this._confFile)) {
            // 加载配置文件
            const conf = fs.readJSONSync(this._confFile);
            // 兼容字符串类型配置
            if (_.isString(conf.template)) {
                this._conf.template.default = conf.template;
            } else {
                this._conf = conf;
            }
        } else {
            // 生成默认配置
            logger.warn(`config file not found, new config created at "${ this._confFile }"`);
            this.saveConfig();
        }
    }

    /**
     * 保存配置
     */
    public saveConfig() {
        const conf = JSON.stringify(this._conf, null, 2);
        fs.writeFileSync(this._confFile, conf);
    }

    /**
     * 判定模板标签是否合法
     * @param tag - 模板标签
     * @private
     */
    private _isTemplateTagValid(tag: string) {
        return /[a-zA-Z][a-zA-Z0-9_]+/.test(tag);
    }

    /**
     * 设定模板地址
     * @param tag - 模板标签
     * @param template - 模板地址
     * @private
     */
    private _setTemplate(tag: string, template: configValue) {
        if (!template) {
            // 清空模板配置
            this._conf.template[tag] = null;
        } else {
            // 设置配置模板地址
            if (!this._isTemplateTagValid(tag)) {
                logger.warn(`${ tag } is not a valid template tag.`);
                return;
            }
            const isTemplateValid = /((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?/.test(template);
            if (!isTemplateValid) {
                logger.warn(`${ template } is not a valid git url.`);
                return;
            }
            logger.info(`set template "${ tag }" -> "${ template }"`);
            this._conf.template[tag] = template;
        }
        this.saveConfig();
    }

    /**
     * 设定 CLI 配置
     * @param key - 配置标签
     * @param value - 配置值
     */
    public setConfig(key: configKey, value: configValue) {
        if (!key) {
            logger.warn('A valid config key must be provided.');
            return;
        }
        if (/^template\./.test(key)) {
            // 模板设置
            const matches = key.match(/^template\.(\w+)$/);
            const tag = (matches && matches[1]) || DEFAULT_TEMPLATE_TAG;
            this._setTemplate(tag, value);
        } else {
            logger.warn(`"${ key }" is not a valid template key.`);
        }
    }

    /**
     * 获取模板地址
     * @param tag - 模板标签
     */
    public getTemplate(tag = DEFAULT_TEMPLATE_TAG): string | null {
        return this._conf.template[tag];
    }

    /**
     * 获取模板
     */
    public listTemplateTags(): string[] {
        return _.keys(this._conf.template);
    }

    /**
     * 删除制定标签模板
     * @param tag - 模板标签
     */
    public removeTemplate(tag: string) {
        if (!this._isTemplateTagValid(tag)) {
            logger.warn(`${ tag } is not a valid template tag.`);
            return;
        }
        logger.info(`Remove template "${ tag }".`);
        _.unset(this._conf.template, tag);
        this.saveConfig();
    }
}
