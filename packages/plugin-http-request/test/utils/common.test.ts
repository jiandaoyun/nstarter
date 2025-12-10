import { expect } from 'chai';
import { withTimeout, delay } from '../../src/utils/common';

describe('utils/common', () => {
    it('withTimeout 应按时超时', async () => {
        try {
            await withTimeout(delay(50), 5, 'timeout');
            throw new Error('should timeout');
        } catch (error) {
            expect((error as Error).message).to.equal('timeout');
        }
    });

    it('withTimeout 应在 promise 成功时清理定时器', async () => {
        const result = await withTimeout(Promise.resolve('ok'), 100, 'timeout');
        expect(result).to.equal('ok');
    });
});

