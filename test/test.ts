import chai from 'chai';

import { TestEntity } from './entities/test.entity';

const expect = chai.expect;

describe('Schema Validation', async () => {
    it('Normal', async () => {
        let result;
        try {
            const test = new TestEntity({
                width: 1,
                height: 2
            });
            result = test.toJSON();
        } catch (err) {
            expect(err).to.not.exist;
        }
        expect(result).to.deep.equal({
            width: 1,
            height: 2,
            meta: {}
        });
    });

    it('Empty', async () => {
        let result;
        try {
            const test = new TestEntity();
            result = test.toJSON();
        } catch (err) {
            expect(err).to.not.exist;
        }
        expect(result).to.equal(null);
    });

    it('Invalid parameters', async () => {
        try {
            const test = new TestEntity({
                width: 1,
                height: -2,
                extra: 3
            });
        } catch (err) {
            expect(err).to.exist;
        }
    });

    it('Extra parameters', async () => {
        let result;
        try {
            const test = new TestEntity({
                width: 1,
                height: 2,
                extra: 3
            });
            result = test.toJSON();
        } catch (err) {
            expect(err).to.not.exist;
        }
        expect(result).to.deep.equal({
            width: 1,
            height: 2,
            meta: {}
        });
    });
});
