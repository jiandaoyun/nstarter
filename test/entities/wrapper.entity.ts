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

    @entityAttr(TestEntity)
    itemMap?: {
        [key: string]: TestEntity
    };

    arr: string[];
}

/**
 * 深层直接嵌套不被支持
 */
export class WrapperArrayMapEntity extends AbstractEntity {
    @entityAttr(TestEntity)
    itemArrayMap?: {
        [key: string]: TestEntity[]
    };
}
