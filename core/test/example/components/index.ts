import { registerComponent, getComponent } from '../../../src';
import { beforeLoad } from './before';

// 组件加载前的前置行为
beforeLoad();

import { FooComponent } from './foo.component';

registerComponent(FooComponent);
export const fooComponent = getComponent<FooComponent>(FooComponent);


import { BarComponent } from './bar.component';
registerComponent(BarComponent);
export const barComponent = getComponent<BarComponent>(BarComponent);
