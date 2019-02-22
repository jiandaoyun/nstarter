import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';
import { logger } from './logger';

interface StarterConf {
    template?: string;
}

type configKey = string | undefined;
type configValue = string | undefined;

const DEFAULT_TEMPLATE = 'https://git.huhamhire.com/huhamhire/ts-express-template.git';

export class Config {
    private readonly _confName = 'config.json';
    private readonly _confFile: string;
    private _conf: StarterConf = {};

    constructor(confPath: string, callback: Function) {
        confPath = confPath || './';
        fs.ensureDirSync(confPath);
        this._confFile = path.join(confPath, this._confName);
        this._initConfig(callback);
    }

    private _initConfig(callback: Function) {
        if (fs.pathExistsSync(this._confFile)) {
            // load config file
            fs.readJSON(this._confFile, (err, conf) => {
                if (err) {
                    return callback(err);
                }
                this._conf = conf;
                return callback();
            });
        } else {
            // create default config
            logger.warn(`config file not found, new config created at "${ this._confFile }"`);
            this.saveConfig(callback);
        }
    }

    public saveConfig(callback: Function) {
        const conf = JSON.stringify(this._conf, null, 2);
        fs.writeFile(this._confFile, conf, (err) => callback(err));
    }

    private _setTemplate(template: configValue, callback: Function) {
        if (!template) {
            // set to default template
            this._conf.template = undefined;
        } else {
            const isValid = /((git|ssh|http(s)?)|(git@[\w\.]+))(:(\/\/)?)([\w\.@\:/\-~]+)(\.git)(\/)?/.test(template);
            if (isValid) {
                this._conf.template = template;
            } else {
                logger.warn(`${ template } is not a valid git url.`);
                return callback();
            }
        }
        this.saveConfig(callback);
    }

    public setConfig(key: configKey, value: configValue, callback: Function) {
        switch (key) {
            case 'template':
                this._setTemplate(value, callback);
                break;
            default:
                break;
        };
    }

    public getTemplate() {
        const template = this._conf.template;
        if (template) {
            logger.info(`using template "${ template }"`);
            return template;
        } else {
            logger.warn(`using default template "${ DEFAULT_TEMPLATE }"`);
            return template;
        }
    }
}
