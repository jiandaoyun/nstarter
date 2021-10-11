import { ServiceError } from '@grpc/grpc-js';
import _ from 'lodash';
import { NsError } from 'nstarter-core';

/**
 * 首字母大写
 * 用于函数名场景，无需考虑 unicode
 * @param str
 */
export const upperFirst = (str: string): string => {
    if (!str) {
        return '';
    }
    return [str.charAt(0).toUpperCase(), str.substring(1)].join('');
};

/**
 * 生成 rpc 服务调用名称
 * @param ctorName
 */
export const getRpcName = (ctorName: string) => {
    if (!ctorName) {
        return '';
    }
    return upperFirst(ctorName.replace(/(service|client)$/i, ''));
};

/**
 * 反序列化错误信息
 * @param originErr
 */
export const deserializeError = (originErr: ServiceError) => {
    const meta = originErr.metadata?.getMap();
    const err = meta?.errcode
        ? new NsError('Grpc', _.toNumber(meta.errcode))
        : new NsError('Grpc', 5);
    if (meta) {
        _.extend(err, {
            ...meta,
            errcode: _.toNumber(meta.errcode),
            errmsg: originErr.details
        });
    }
    return err;
};
