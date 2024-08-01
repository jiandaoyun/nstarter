import { expect } from 'chai';

import NsUtils from '../../src';

describe('string utils', () => {
    it('words', async () => {
        expect(NsUtils.words('fred, barney, & pebbles')).deep.eq(['fred', 'barney', 'pebbles']);
        expect(NsUtils.words('fred, barney, & pebbles', /[^, ]+/g)).deep.eq(['fred', 'barney', '&', 'pebbles']);
    });
    it('snakeCase', async () => {
        expect( NsUtils.snakeCase('Foo Bar')).eq('foo_bar');
        expect(NsUtils.snakeCase('fooBar')).eq('foo_bar');
        expect( NsUtils.snakeCase('--FOO-BAR--')).eq('foo_bar');
    });
});
