import { expect } from 'chai';
import { ObjectId as MongodbObjectId } from 'mongodb';
import { Types } from 'mongoose';
import { isEmptyMongoId, isEmptyObjectId, ObjectId } from '../src';

describe('utils', () => {
    it('isEmptyObjectId', async () => {
        expect(isEmptyObjectId(new ObjectId())).eq(false);
        expect(isEmptyObjectId(new ObjectId('64d9ed22d7081437d9fe5b23'))).eq(false);
        expect(isEmptyObjectId(new Types.ObjectId())).eq(false);
        expect(isEmptyObjectId(new Types.ObjectId('64d9ed22d7081437d9fe5b23'))).eq(false);
        expect(isEmptyObjectId(new MongodbObjectId())).eq(false);
        expect(isEmptyObjectId(new MongodbObjectId('64d9ed22d7081437d9fe5b23'))).eq(false);
        expect(isEmptyObjectId(null)).eq(true);
        expect(isEmptyObjectId(undefined)).eq(true);
    });

    it('isEmptyMongoId', async () => {
        expect(isEmptyMongoId(new ObjectId())).eq(false);
        expect(isEmptyMongoId(new ObjectId('64d9ed22d7081437d9fe5b23'))).eq(false);
        expect(isEmptyMongoId(new Types.ObjectId())).eq(false);
        expect(isEmptyMongoId(new Types.ObjectId('64d9ed22d7081437d9fe5b23'))).eq(false);
        expect(isEmptyMongoId(new MongodbObjectId())).eq(false);
        expect(isEmptyMongoId(new MongodbObjectId('64d9ed22d7081437d9fe5b23'))).eq(false);
        expect(isEmptyMongoId(null)).eq(true);
        expect(isEmptyMongoId(undefined)).eq(true);
        expect(isEmptyMongoId('')).eq(true);
    });
});
