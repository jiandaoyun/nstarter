import 'reflect-metadata';
import { ValidateFunction } from 'ajv';

import { SchemaManager } from './schema.manager';
import { Definition } from 'typescript-json-schema';
import { ValidationError } from './error';
import { metaKey } from './enums';

/**
 * 实体对象基类
 */
export abstract class AbstractEntity {
    private readonly _schema: Definition;
    private readonly _validator: ValidateFunction;
    private _isValid = false;

    /**
     * @constructor
     * @param obj - JSON 对象
     */
    constructor(obj?: any) {
        // 加载 schema
        const name = this.constructor.name;
        this._schema = SchemaManager.getInstance().getSchema(name);
        this._validator = SchemaManager.getInstance().getValidator(name);

        // 初始化
        if (obj) {
            this.fromJSON(obj);
        }
    }

    /**
     * 基于 JSON 数据生成对象实例
     * @param obj - JSON 对象
     */
    public fromJSON(obj: any) {
        const isValid = this._validator(obj);
        if (!isValid) {
            throw new ValidationError(this, this._validator.errors, { obj });
        }
        // 递归实例化
        const result: any = {};
        for (const prop in obj) {
            if (!obj.hasOwnProperty(prop)) {
                continue;
            }
            const val = obj[prop];
            const Entity: Constructor = Reflect.getMetadata(metaKey.constructor, this, prop);
            if (Entity) {
                // 基于 schema 可用性判定是否允许递归实例化
                if (SchemaManager.getInstance().hasSchema(Entity.name)) {
                    result[prop] = new Entity(val);
                    continue;
                } else if (Entity === Array) {
                    const Item: Constructor = Reflect.getMetadata(metaKey.itemConstructor, this, prop);
                    if (Array.isArray(val) && SchemaManager.getInstance().hasSchema(Item.name)) {
                        // 数组递归实例化
                        result[prop] = val.map((itemObj) => new Item(itemObj));
                        continue;
                    }
                }
            }
            result[prop] = val;
        }
        Object.assign(this, result);
        this._isValid = true;
    };

    /**
     * 将对象实例转换为 JSON
     */
    public toJSON(): any {
        // 无效对象实例返回空值
        if (!this._isValid) {
            return null;
        }
        const result: any = {};
        for (const prop in this) {
            // 仅选取 schema 定义选择的属性
            if (this._schema.properties?.hasOwnProperty(prop)) {
                const val = this[prop];
                if (val instanceof AbstractEntity) {
                    // 递归实体
                    result[prop] = val.toJSON();
                } else if (Array.isArray(val)) {
                    // 递归数组
                    result[prop] = val.map((item) => {
                        if (item instanceof AbstractEntity) {
                            return item.toJSON();
                        } else {
                            return item;
                        }
                    });
                } else {
                    result[prop] = val;
                }
            }
            // 类定义不支持扩展属性
            // 无需处理 patternProperties 与 additionalProperty
        }
        return result;
    };
}
