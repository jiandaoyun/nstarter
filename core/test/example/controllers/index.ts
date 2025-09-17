import { getCtl, registerCtl } from '../../../src';
import { DemoController } from './demo.controller';

registerCtl(DemoController);

export const demoController = getCtl<DemoController>(DemoController);
