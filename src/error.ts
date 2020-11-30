import { ErrorObject } from 'ajv';
import { AbstractEntity } from './abstract.entity';

/**
 * 结构校验错误
 */
export class ValidationError extends Error {
    public meta: any;

    constructor(entity: AbstractEntity, errors?: null | Array<ErrorObject>, meta?: any) {
        super();
        this.name = this.constructor.name;
        const name = entity.constructor.name;
        const messages = errors?.map((errInfo) =>
            `\t- ${ name }${ errInfo.dataPath } ${ errInfo.message }`
        );
        this.message = `Failed to validate object "${ name }".\n${ messages?.join('\n') }`;
        this.meta = { errors, ...meta };
    }
}
