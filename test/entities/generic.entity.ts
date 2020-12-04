import { AbstractEntity } from '../../src';

/**
 * 泛型类型测试
 */
export class GenericEntity<T extends AbstractEntity> extends AbstractEntity {
    item: T
}
