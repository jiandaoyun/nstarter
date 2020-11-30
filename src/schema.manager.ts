import * as fs from 'fs';
import Ajv, { ValidateFunction } from 'ajv';
import { Definition } from 'typescript-json-schema';
import { ISchemaFormats, ISchemaManagerConfig } from './types';

/**
 * 实例模型管理器
 */
class EntitySchemaManager {
    private readonly _ajv: Ajv.Ajv;
    private readonly _schemaValidatorMap: {
        [key: string]: Ajv.ValidateFunction
    } = {};
    private readonly _schemaDefinitionMap: {
        [key: string]: Definition
    } = {};
    private readonly _schemaCustomTypes: ISchemaFormats = {};

    /**
     * @constructor
     * @param config - 配置
     */
    constructor(config: ISchemaManagerConfig) {
        // 加载结构定义
        try {
            const content = JSON.parse(
                fs.readFileSync(config.definitions, {
                    encoding: 'utf-8'
                })
            );
            this._schemaDefinitionMap = content.definitions || {};
        } catch (err) {
            throw new Error(`Failed to load schema definition file "${ config.definitions }".`);
        }

        // 初始化 Ajv 实例
        this._schemaCustomTypes = config.formats || {};
        this._ajv = new Ajv({
            useDefaults: true,
            coerceTypes: true,
            removeAdditional: true,
            $data: true
        });

        // 定义自定义格式
        for (const format in this._schemaCustomTypes) {
            if (this._schemaCustomTypes.hasOwnProperty(format)) {
                const pattern = this._schemaCustomTypes[format];
                this._ajv.addFormat(format, pattern);
            }
        }
    }

    /**
     * 获取数据结构模型
     * @param name - 实体类名
     */
    public getSchema(name: string): Definition {
        const schema = this._schemaDefinitionMap[name];
        if (!schema) {
            throw new Error(`Failed to load schema for "${ name }".`);
        }
        return schema;
    }

    /**
     * 获取结构校验方法
     * @param name - 实体类名
     */
    public getValidator(name: string): ValidateFunction {
        let validator = this._schemaValidatorMap[name];
        if (!validator) {
            validator = this._ajv.compile(this.getSchema(name));
        }
        return validator;
    }
}

export const schemaManager = new EntitySchemaManager({
    definitions: './resources/schema.entities.json'
});
