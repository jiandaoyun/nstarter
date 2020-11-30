import { schemaManager } from './schema.manager';
import { Definition } from 'typescript-json-schema';
import { ValidateFunction } from 'ajv';
import { ValidationError } from './error';

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
        this._schema = schemaManager.getSchema(name);
        this._validator = schemaManager.getValidator(name);

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
        Object.assign(this, obj);
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
                result[prop] = this[prop];
            }
            // 类定义不支持扩展属性
            // 无需处理 patternProperties 与 additionalProperty
        }
        return result;
    };
}
