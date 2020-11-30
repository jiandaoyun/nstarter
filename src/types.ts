import { FormatValidator } from 'ajv';

export interface ISchemaFormats {
    [format: string]: FormatValidator;
}

export interface ISchemaManagerConfig {
    definitions: string;
    formats?: ISchemaFormats;
}
