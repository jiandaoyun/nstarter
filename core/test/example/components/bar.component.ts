import { BaseComponent, component, injectComponent } from '../../../src';
import { FooComponent } from './foo.component';

@component()
export class BarComponent extends BaseComponent {
    @injectComponent()
    private _fooComponent: FooComponent;

    public async init() {
        this.setReady(true);
    }

    public getStatus() {
        return this._fooComponent.getStatus();
    }

    public async shutdown() {
        await super.shutdown();
    }
}
