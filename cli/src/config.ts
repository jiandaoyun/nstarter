import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import { Logger } from 'nstarter-core';
import { CLI_NAME, DEFAULT_REPO, DEFAULT_REPO_TAG } from './constants';
import { pkg } from './pkg';

export interface IToolConf {
    repos: {
        [key: string]: string | null
    };
}

export type configKey = string | undefined;
export type configValue = string | undefined;


/**
 * 判定模板标签是否合法
 * @param tag - 模板标签
 */
const _isRepoTagValid = (tag: string) =>
    /[a-zA-Z][a-zA-Z0-9_]+/.test(tag);

/**
 * 工具配置管理
 */
class ToolConfig {
    private readonly _workDir: string;
    private readonly _confName = 'config.json';
    private readonly _confFile: string;
    private _conf: IToolConf = {
        repos: {}
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
        this.loadConfig();
    }

    /**
     * 获取工作目录
     */
    public get workDir() {
        return this._workDir;
    }

    /**
     * 加载配置
     */
    public loadConfig() {
        if (fs.pathExistsSync(this._confFile)) {
            // 加载配置文件
            const conf = fs.readJSONSync(this._confFile);
            // 兼容字符串类型配置
            if (_.isString(conf.template)) {
                this._conf.repos.default = conf.template;
            } else {
                this._conf = conf;
                // 默认仓库
                this._conf.repos = {
                    [DEFAULT_REPO_TAG]: DEFAULT_REPO,
                    ...this._conf.repos
                };
            }
        } else {
            // 生成默认配置, 启动阶段 Logger 未初始化
            console.log(`Config file not found, new config created at "${ this._confFile }"`);
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
     * 获取配置内容
     */
    public getConfig(): IToolConf {
        return this._conf;
    }

    /**
     * 设定模板地址
     * @param tag - 模板标签
     * @param repoSrc - 模板 Git 仓库地址
     * @private
     */
    private _setRepoSource(tag: string, repoSrc: configValue) {
        if (!repoSrc) {
            // 清空模板配置
            this._conf.repos[tag] = null;
        } else {
            // 设置配置模板地址
            if (!_isRepoTagValid(tag)) {
                Logger.warn(`${ tag } is not a valid repository tag.`);
                return;
            }
            const isRepoValid = /((git|ssh|http(s)?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?/.test(repoSrc);
            if (!isRepoValid) {
                Logger.warn(`${ repoSrc } is not a valid git url.`);
                return;
            }
            Logger.info(`set repository "${ tag }" -> "${ repoSrc }"`);
            this._conf.repos[tag] = repoSrc;
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
        if (/^repo\./.test(key)) {
            // 模板设置
            const matches = key.match(/^repo\.(\w+)$/);
            const tag = (matches?.[1]) || DEFAULT_REPO_TAG;
            this._setRepoSource(tag, value);
        } else {
            Logger.warn(`"${ key }" is not a valid repository key.`);
        }
    }

    /**
     * 删除制定标签模板
     * @param repoTag - 仓库标签
     */
    public removeRepo(repoTag: string) {
        if (!_isRepoTagValid(repoTag)) {
            Logger.warn(`${ repoTag } is not a valid repository tag.`);
            return;
        }
        Logger.info(`Remove repository "${ repoTag }".`);
        _.unset(this._conf.repos, repoTag);
        this.saveConfig();
    }
}

export const config = new ToolConfig();
