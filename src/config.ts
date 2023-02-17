import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import { Logger } from 'nstarter-core';
import { CLI_NAME, DEFAULT_TEMPLATE_TAG } from './constants';
import { configKey, configValue, IToolConf } from './types/config';
import { pkg } from './pkg';

/**
 * 判定模板标签是否合法
 * @param tag - 模板标签
 */
const _isTemplateTagValid = (tag: string) => /[a-zA-Z][a-zA-Z0-9_]+/.test(tag);

/**
 * 工具配置管理
 */
class ToolConfig {
    private readonly _workDir: string;
    private readonly _confName = 'config.json';
    private readonly _confFile: string;
    private readonly _conf: IToolConf = {
        template: {}
    };
    public readonly version = pkg.version;

    /**
     * @constructor
     */
    constructor() {
        // 设定工作目录
        const homePath = process.env.USERPROFILE || process.env.HOME;
        if (homePath) {
            this._workDir = path.join(homePath, `.${ CLI_NAME }`);
        } else {
            this._workDir = path.resolve('./');
        }
        fs.ensureDirSync(this._workDir);

        // 初始化配置
        this._confFile = path.join(this._workDir, this._confName);
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
            Logger.warn(`config file not found, new config created at "${ this._confFile }"`);
            this.saveConfig();
        }
    }

    /**
     * 获取工作目录
     */
    public get workDir() {
        return this._workDir;
    }

    /**
     * 保存配置
     */
    public saveConfig() {
        const conf = JSON.stringify(this._conf, null, 2);
        fs.writeFileSync(this._confFile, conf);
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
            if (!_isTemplateTagValid(tag)) {
                Logger.warn(`${ tag } is not a valid template tag.`);
                return;
            }
            const isTemplateValid = /((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?/.test(template);
            if (!isTemplateValid) {
                Logger.warn(`${ template } is not a valid git url.`);
                return;
            }
            Logger.info(`set template "${ tag }" -> "${ template }"`);
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
            Logger.warn('A valid config key must be provided.');
            return;
        }
        if (/^template\./.test(key)) {
            // 模板设置
            const matches = key.match(/^template\.(\w+)$/);
            const tag = (matches?.[1]) || DEFAULT_TEMPLATE_TAG;
            this._setTemplate(tag, value);
        } else {
            Logger.warn(`"${ key }" is not a valid template key.`);
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
     * 检查模板是否已配置
     * @param tag - 模板标签
     */
    public isTemplateExisted(tag: string): boolean {
        return !_.isEmpty(this._conf.template[tag]);
    }

    /**
     * 删除制定标签模板
     * @param tag - 模板标签
     */
    public removeTemplate(tag: string) {
        if (!_isTemplateTagValid(tag)) {
            Logger.warn(`${ tag } is not a valid template tag.`);
            return;
        }
        Logger.info(`Remove template "${ tag }".`);
        _.unset(this._conf.template, tag);
        this.saveConfig();
    }

    /**
     * 获取模板工程工作目录路径
     * @param tag - 模板标签
     */
    public getTemplatePath(tag: string): string {
        return path.join(this._workDir, `templates/${ tag }`);
    }
}

export const config = new ToolConfig();
