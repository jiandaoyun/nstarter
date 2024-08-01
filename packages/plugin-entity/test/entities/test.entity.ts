import { AbstractEntity } from '../../src';

export class TestEntity extends AbstractEntity {
    /**
     * @minimum 0
     * @type integer
     */
    width: number;

    /**
     * @minimum 0
     * @type integer
     * @multipleOf 2
     */
    height: number;

    /**
     * 信息
     * @default {}
     */
    meta: {
        description?: string
    }

    /**
     * @ignore
     */
    public get ignore(): string {
        return 'ignored';
    }
}
