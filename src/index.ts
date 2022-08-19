import * as Constants from './constants';

import * as CommonUtils from './utils/common.utils';
import * as FileUtils from './utils/file.utils';

const NsUtils = {
    ...Constants,
    ...CommonUtils,
    ...FileUtils
};

export = NsUtils;
