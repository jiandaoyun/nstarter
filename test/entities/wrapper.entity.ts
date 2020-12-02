import { AbstractEntity } from '../../src';
import { TestEntity } from './test.entity';
import { entityAttr } from '../../src/decorators';

/**
 * 递归测试实体
 */
export class WrapperEntity extends AbstractEntity {
    /**
     * @minItems 1
     */
    @entityAttr(TestEntity)
    items: TestEntity[];

    @entityAttr()
    item: TestEntity;

    arr: string[];
}
