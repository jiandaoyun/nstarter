/**
 * Copyright (c) 2015-2026, FineX, All Rights Reserved.
 * @author Kodomo
 * @date 2025/6/20
 */

import { test } from '@japa/runner';
import './types';
import { TimeoutError, LostLockError } from 'redis-semaphore';
import { getNsError } from '../src/error';

test.group('Error', () => {

    class MockError extends Error {
    }

    test('getNsError').with([{
        NsError: TimeoutError
    }, {
        NsError: LostLockError
    }, {
        NsError: MockError
    }]).run(({ assert }, { NsError }) => {
        const err = new NsError('my error');
        const newErr = getNsError(err);
        assert.instanceOf(newErr, NsError);
    });
});
