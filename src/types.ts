import { FormatValidator } from 'ajv';

export interface ISchemaFormats {
    [format: string]: FormatValidator;
}
