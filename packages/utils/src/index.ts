import * as Constants from './constants';

import * as ArrayUtils from './utils/array.utils';
import * as CommonUtils from './utils/common.utils';
import * as FileUtils from './utils/file.utils';
import * as EncodeUtils from './utils/encode.utils';
import * as HashUtils from './utils/hash.utils';
import * as NumberUtils from './utils/number.utils';
import * as StringUtils from './utils/string.utils';
import * as ObjectUtils from './utils/object.utils';

const NsUtils = {
    ...ArrayUtils,
    ...Constants,
    ...CommonUtils,
    ...FileUtils,
    ...EncodeUtils,
    ...HashUtils,
    ...NumberUtils,
    ...StringUtils,
    ...ObjectUtils
};

/**
 * 保持 import { isNil } from 'nstarter-utils' 的方式导入
 */
export * from './constants';
export * from './utils/array.utils';
export * from './utils/common.utils';
export * from './utils/file.utils';
export * from './utils/encode.utils';
export * from './utils/hash.utils';
export * from './utils/number.utils';
export * from './utils/string.utils';
export * from './utils/object.utils';

/**
 * 保持 import NsUtils from 'nstarter-utils' 的方式导入
 */
// eslint-disable-next-line import/no-default-export
export default NsUtils;
