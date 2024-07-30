import _ from 'lodash';

export const formatStdOutput = (data: Buffer) =>
    _.toString(data).replace(/\n$/, '');
