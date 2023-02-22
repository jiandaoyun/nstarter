import * as Constants from './constants';

import * as CommonUtils from './utils/common.utils';
import * as FileUtils from './utils/file.utils';
import * as EncodeUtils from './utils/encode.utils';
import * as HashUtils from './utils/hash.utils';
import * as NumberUtils from './utils/number.utils';

const NsUtils = {
    ...Constants,
    ...CommonUtils,
    ...FileUtils,
    ...EncodeUtils,
    ...HashUtils,
    ...NumberUtils
};

// eslint-disable-next-line import/no-default-export
export default NsUtils;
