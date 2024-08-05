import type { Format } from 'ajv';

export interface ISchemaFormats {
    [format: string]: Format;
}
