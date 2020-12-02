import * as fs from 'fs';
import Ajv, { ValidateFunction } from 'ajv';
import { Definition } from 'typescript-json-schema';
import { ISchemaFormats } from './types';

/**
 * 实例模型管理器
 */
export class SchemaManager {
    private static instance: SchemaManager;

    private readonly _ajv: Ajv.Ajv;
    private readonly _schemaValidatorMap: {
        [key: string]: Ajv.ValidateFunction
    } = {};
    private readonly _schemaDefinitionMap: {
        [key: string]: Definition
    } = {};

    /**
     * @constructor
     * @param definition - 配置
     */
    constructor(definition: string) {
        // 加载结构定义
        try {
            const content = JSON.parse(
                fs.readFileSync(definition, {
                    encoding: 'utf-8'
                })
            );
            this._schemaDefinitionMap = content.definitions || {};
        } catch (err) {
            throw new Error(`Failed to load schema definition file "${ definition }".`);
        }

        // 初始化 Ajv 实例
        this._ajv = new Ajv({
            useDefaults: true,
            coerceTypes: true,
            removeAdditional: true,
            $data: true
        });
    }

    /**
     * 初始化实例
     * @param definition
     * @constructor
     */
    public static Initialize(definition: string) {
        // 只能被初始化一次
        if (SchemaManager.instance) {
            throw new Error('EntitySchemaManager could only be initialized once.');
        }
        SchemaManager.instance = new SchemaManager(definition);
        return SchemaManager.instance;
    }


    /**
     * 获取实例
     * @returns {SchemaManager} - 获取实例
     * @static
     */
    public static getInstance() {
        if (!SchemaManager.instance) {
            throw new Error('EntitySchemaManager has not been initialized.');
        }
        return SchemaManager.instance;
    }

    /**
     * 配置自定义数据格式
     * @param formats
     */
    public setSchemaFormats(formats: ISchemaFormats) {
        for (const format in formats) {
            if (formats.hasOwnProperty(format)) {
                const pattern = formats[format];
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
     * 判定对象是否存在实体结构定义
     * @param name - 实体类名
     */
    public hasSchema(name: string): boolean {
        return !!this._schemaDefinitionMap[name];
    }

    /**
     * 获取结构校验方法
     * @param name - 实体类名
     */
    public getValidator(name: string): ValidateFunction {
        let validator = this._schemaValidatorMap[name];
        if (!validator) {
            validator = this._ajv.compile({
                ...this.getSchema(name),
                // 类型引用定义
                definitions: this._schemaDefinitionMap
            });
            this._schemaValidatorMap[name] = validator;
        }
        return validator;
    }
}
