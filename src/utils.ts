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
    // GRPC 错误包装为 NsError
    const err = new NsError('Grpc', 5);
    // 从原始错误中获取错误码与错误信息
    _.extend(err, {
        errCode: _.toNumber(originErr.code),
        errmsg: originErr.details,
    });
    // 从原始错误中获取错误meta信息
    const meta = originErr.metadata?.getMap();
    if (meta) {
        _.extend(err, {
            ...meta
        });
    }
    return err;
};
