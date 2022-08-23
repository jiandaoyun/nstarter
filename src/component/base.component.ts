import { injectable } from 'inversify';
import { EventEmitter } from 'events';

import { Logger } from '../loggers';
import { ComponentEvents, ComponentState } from './types';

@injectable()
export class BaseComponent extends EventEmitter {
    protected _name: string;
    protected _state: ComponentState = ComponentState.inactive;

    /**
     * 启动服务组件
     */
    public async init() {
        this.setReady(true);
        this.emit(ComponentEvents.ready);
    }

    /**
     * 关闭服务组件
     */
    public async shutdown() {
        this.setReady(false);
        this.emit(ComponentEvents.down);
    }

    /**
     * 获取组件状态是有已就绪
     */
    public isReady(): boolean {
        return this._state === ComponentState.active;
    }

    /**
     * 设置组件初始化状态
     * @param isReady
     */
    public setReady(isReady: boolean) {
        if (isReady) {
            this._state = ComponentState.active;
            Logger.info(`init ${ this._name } ... ok`);
        } else {
            this._state = ComponentState.inactive;
            Logger.info(`shutdown ${ this._name } ... ok`);
        }
    }
}
