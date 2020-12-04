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
     * 生成内部对象实体
     * @param obj - 对象
     * @param ItemEntity - 递归生成子属性场景下的嵌套类型 (最多递归一层)
     * @private
     */
    private _generateEntity(obj: any, ItemEntity?: Constructor) {
        const result: any = {};
        for (const prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                const val = obj[prop];
                const Entity: Constructor = ItemEntity || Reflect.getMetadata(metaKey.constructor, this, prop);
                if (Entity) {
                    // 基于 schema 可用性判定是否允许递归实例化
                    if (SchemaManager.getInstance().hasSchema(Entity.name)) {
                        result[prop] = new Entity().assign(val);
                        continue;
                    } else if (Entity === Array) {
                        // 数组递归实例化
                        const Item: Constructor = Reflect.getMetadata(metaKey.itemConstructor, this, prop);
                        if (Array.isArray(val) && Item && SchemaManager.getInstance().hasSchema(Item.name)) {
                            result[prop] = val.map((itemObj) => new Item().assign(itemObj));
                            continue;
                        }
                    } else if (Entity === Object) {
                        // 嵌套对象递归实例化
                        const Item: Constructor = Reflect.getMetadata(metaKey.itemConstructor, this, prop);
                        if (Item && SchemaManager.getInstance().hasSchema(Item.name)) {
                            result[prop] = this._generateEntity(val, Item);
                            continue;
                        }
                    }
                }
                result[prop] = val;
            }
        }
        return result;
    }

    /**
     * 基于 JSON 数据直接赋值创建实例 (无结构校验)
     * 用于已再最外层经过结构校验的场景，避免内层重复校验
     * @param obj - 经过结构校验的安全对象
     */
    public assign(obj: any) {
        let target;
        if (obj instanceof this.constructor) {
            // 对象实例直接赋值，跳过解析过程 （浅拷贝逻辑）
            target = obj;
        } else {
            target = this._generateEntity(obj);
        }
        Object.assign(this, target);
        this._isValid = true;
        return this;
    }

    /**
     * 基于 JSON 数据生成对象实例
     * @param obj - JSON 对象
     */
    public fromJSON(obj: any) {
        if (!(obj instanceof this.constructor)) {
            // 仅校验非对象实例
            const isValid = this._validator(obj);
            if (!isValid) {
                throw new ValidationError(this, this._validator.errors, { obj });
            }
        }
        this.assign(obj);
    };

    /**
     * 生成对象 JSON
     * @param obj - 待生成对象
     * @param schema - 对象结构定义
     * @private
     */
    private _generateJSON(obj: any, schema?: Definition): any {
        const result: any = {};
        const objSchema = schema || this._schema;
        for (const prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                // 子属性接口支持扩展
                const supportAdditional = schema && (schema.additionalProperties || schema.patternProperties);
                // 使用 schema 属性，或者支持扩展属性
                const isPropValid = (!objSchema.properties || supportAdditional)
                    || objSchema.properties.hasOwnProperty(prop);
                if (isPropValid) {
                    // 仅选取 schema 定义选择的属性
                    const val = obj[prop];
                    if (val instanceof AbstractEntity) {
                        // 嵌套实体
                        result[prop] = val.toJSON();
                    } else if (Array.isArray(val)) {
                        // 嵌套数组
                        result[prop] = val.map((item) => {
                            if (item instanceof AbstractEntity) {
                                return item.toJSON();
                            } else {
                                return item;
                            }
                        });
                    } else if (Reflect.getMetadata(metaKey.itemConstructor, this, prop) && objSchema.properties) {
                        // 递归实体
                        result[prop] = this._generateJSON(val, objSchema.properties[prop] as Definition);
                    } else {
                        result[prop] = val;
                    }
                }
            }
        }
        return result;
    }

    /**
     * 将对象实例转换为 JSON
     */
    public toJSON(): any {
        // 无效对象实例返回空值
        if (!this._isValid) {
            return null;
        }
        return this._generateJSON(this);
    };
}
