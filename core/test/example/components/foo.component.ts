import { BaseComponent, component } from '../../../src';

@component()
export class FooComponent extends BaseComponent {

    public async init() {
        this.setReady(true);
    }

    public getStatus() {
        return this.isReady() ? 'ready' : 'not_ready';
    }

    public async shutdown() {
        await super.shutdown();
    }
}
