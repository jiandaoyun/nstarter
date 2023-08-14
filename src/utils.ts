import { MongoId, ObjectId } from './types';

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
