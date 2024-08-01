import chai from 'chai';
import { camelCase, lowerFirst, upperFirst } from '../../src/utils';

const should = chai.should();

describe('utils', () => {
    it('lowerFirst', async() => {
        lowerFirst('Fred').should.equal('fred');
        lowerFirst('FRED').should.equal('fRED');
    });

    it('upperFirst', async() => {
        upperFirst('fred').should.equal('Fred');
        upperFirst('FRED').should.equal('FRED');
    });

    it('camelCase', async () => {
        camelCase('Foo Bar').should.equal('fooBar');
        camelCase('--foo-bar--').should.equal('fooBar');
        camelCase('__FOO_BAR__').should.equal('fooBar');
        camelCase('The_quick_brown foxJumps_0ver-The-lazyDog')
            .should.equal('theQuickBrownFoxJumps0VerTheLazyDog');
    });
});
