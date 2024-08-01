import Agenda from 'agenda';
import { IAgendaConf, IErrorHandler, IReadyHandler } from '../types';

/**
 * Agenda 连接管理
 */
export class AgendaManager {
    private _agenda: Agenda;
    private readonly _options: IAgendaConf;

    constructor(conf: IAgendaConf) {
        this._options = conf;
        if (conf.mongodb.readyState === 1) {
            // mongodb 链接已经建立，直接初始化
            this._initAgenda();
        } else {
            // 未建立链接，等待
            conf.mongodb.db.on('open', () => {
                this._initAgenda();
            });
        }
    }

    /**
     * 执行 agenda 初始化配置
     * @private
     */
    private _initAgenda() {
        const o = this._options;
        const config = {
            // 默认配置
            name: '',
            processEvery: 60000,
            defaultConcurrency: 5,
            maxConcurrency: 20,
            defaultLockTime: 30000,
            lockLimit: 50,
            // 用户配置
            ...o.agenda,
            // 数据库配置
            mongo: o.mongodb.db,
            db: {
                collection: o.collection
            }
        };
        this._agenda = new Agenda(config);
        this.setReadyHandler(o.onReady);
        this.setErrorHandler(o.onError);
    }

    public setReadyHandler(handler?: IReadyHandler) {
        if (handler) {
            this._agenda.on('ready', handler);
        }
    }

    public setErrorHandler(handler?: IErrorHandler) {
        if (handler) {
            this._agenda.on('error', handler);
        }
    }
}
