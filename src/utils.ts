import _ from 'lodash';

export class Utils {
    public static formatStdOutput(data: Buffer) {
        return _.toString(data).replace(/\n$/, '');
    }
}
