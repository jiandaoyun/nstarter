import type { Agent } from './types';

/**
 * APM 连接管理
 */
class ApmConnector {
    private _apm: Agent | null = null;

    public setApmAgent (apm: Agent) {
        this._apm = apm;
    }

    public get apm (): Agent | null {
        return this._apm;
    }
}

export const apmConnector = new ApmConnector();
