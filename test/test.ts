import chai from 'chai';

import { TestEntity } from './entities/test.entity';
import { InvalidEntity } from './invalid/invalid.entity';
import { SchemaManager } from '../src';
import { WrapperEntity } from './entities/wrapper.entity';
import { GenericEntity } from './entities/generic.entity';

const expect = chai.expect;

describe('SchemaManager', async () => {
    it('getInstance without initialize', async () => {
        try {
            SchemaManager.getInstance()
        } catch (err) {
            // 未初始化加载实例
            expect(err).to.exist;
        }
    });

    it('Wrong definition', async () => {
        try {
            const schemaManager = SchemaManager.Initialize('./resources/schema.invalid.json');
            // 允许加载多个结构定义文件
            schemaManager.loadSchemaDefinition('./resources/schema.invalid.json');
            schemaManager.setSchemaFormats({
                'oid': /^[0-9a-f]{24}$/
            });
        } catch (err) {
            expect(err).to.exist;
        }
    });

    it('Initialize', async () => {
        try {
            const schemaManager = SchemaManager.Initialize('./resources/schema.entities.json');
            schemaManager.setSchemaFormats({
                'oid': /^[0-9a-f]{24}$/
            });
        } catch (err) {
            expect(err).to.not.exist;
        }
    });

    it('Duplicate initialize', async () => {
        try {
            SchemaManager.Initialize('')
        } catch (err) {
            // 重复初始化
            expect(err).to.exist;
        }
    });
});

describe('Schema Validation', async () => {
    it('Normal', async () => {
        let result;
        try {
            const test = new TestEntity({
                width: 1,
                height: 2
            });
            result = test.toJSON();
            expect(test.ignore).to.equal('ignored');
        } catch (err) {
            expect(err).to.not.exist;
        }
        expect(result).to.deep.equal({
            width: 1,
            height: 2,
            meta: {}
        });
    });

    it('Empty', async () => {
        let result;
        try {
            const test = new TestEntity();
            result = test.toJSON();
        } catch (err) {
            expect(err).to.not.exist;
        }
        expect(result).to.equal(null);
    });

    it('Invalid parameters', async () => {
        try {
            new TestEntity({
                width: 1,
                height: -2,
                extra: 3
            });
        } catch (err) {
            expect(err).to.exist;
        }
    });

    it('Extra parameters', async () => {
        let result;
        try {
            const test = new TestEntity({
                width: 1,
                height: 2,
                extra: 3
            });
            result = test.toJSON();
        } catch (err) {
            expect(err).to.not.exist;
        }
        expect(result).to.deep.equal({
            width: 1,
            height: 2,
            meta: {}
        });
    });
});

describe('Nested Entity', async () => {
    it('Normal', async () => {
        let result;
        try {
            const test = new WrapperEntity({
                items: [{
                    width: 1,
                    height: 2
                }],
                item: {
                    width: 3,
                    height: 4
                },
                arr: ['a', 'b']
            });
            result = test.toJSON();
        } catch (err) {
            expect(err).to.not.exist;
        }
        expect(result).to.deep.equal({
            arr: ['a', 'b'],
            item: {
                width: 3,
                height: 4,
                meta: {}
            },
            items: [{
                width: 1,
                height: 2,
                meta: {}
            }]
        });
    });
});

describe('Generic Entity', async () => {
    it('Generic', async () => {
        let result;
        try {
            const test = new GenericEntity<TestEntity>({
                item: {
                    width: 1,
                    height: -2
                }
            });
            result = test.toJSON();
        } catch (err) {
            // 不支持泛型校验
            expect(err).to.not.exist;
        }
        expect(result).to.deep.equal({
            item: {}
        });
    });
});

describe('Invalid Entity', async () => {
    it('Invalid', async () => {
        try {
            new InvalidEntity();
        } catch (err) {
            expect(err).to.exist;
        }
    });
});
