import { registerComponent, getComponent } from '../../../src';
import { beforeLoad } from './before';

// 组件加载前的前置行为
beforeLoad();

import { TestComponent } from './test.component';

registerComponent(TestComponent);
export const testComponent = getComponent<TestComponent>(TestComponent);
