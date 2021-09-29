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
