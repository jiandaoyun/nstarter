import * as Constants from './constants';

import * as CommonUtils from './utils/common.utils';
import * as FileUtils from './utils/file.utils';
import * as DateUtils from './utils/date.utils';
import * as EncodeUtils from './utils/encode.utils';
import * as HashUtils from './utils/hash.utils';
import * as NumberUtils from './utils/number.utils';
import * as StringUtils from './utils/string.utils';

const NsUtils = {
    ...Constants,
    ...CommonUtils,
    ...FileUtils,
    ...DateUtils,
    ...EncodeUtils,
    ...HashUtils,
    ...NumberUtils,
    ...StringUtils
};

export = NsUtils;
