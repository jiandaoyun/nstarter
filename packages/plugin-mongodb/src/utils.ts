import type { MongoId, ObjectId } from './types';

/**
 * 判断 ObjectId 对象是否为空
 * @param value
 */
export const isEmptyObjectId = (value: ObjectId | null | undefined): boolean => {
    return value === null || value === undefined;
};

/**
 * 判断 MongoId 对象是否为空
 * @param value
 */
export const isEmptyMongoId = (value: MongoId | null | undefined): boolean => {
    return value === null || value === undefined || value === '';
};

/**
 * 检查字符串是否为合法的 ObjectId
 * @param {MongoId} val - 待检查的字符串
 * @return {boolean} - 是否为合法的 ObjectId
 */
export const isValidObjectId = (val: MongoId | undefined | null): val is MongoId => /^[0-9a-f]{24}$/.test(`${ val }`);

/**
 * 比较两个 ObjectId 是否相等
 * @param {MongoId|null} lhs - 第一个 ObjectId
 * @param {MongoId|null} rhs - 第二个 ObjectId
 * @return {boolean} - 是否相等
 * @author vista
 */
export const isObjectIdEqual = (
    lhs?: MongoId | null,
    rhs?: MongoId | null
): boolean => !!lhs && !!rhs && `${ lhs }` === `${ rhs }`;
