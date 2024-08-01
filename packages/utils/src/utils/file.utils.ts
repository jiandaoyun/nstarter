/**
 * 文件处理相关工具方法
 */

/**
 * 安全处理文件名中的特殊字符
 * @param filename - 待转义文件名
 * @param replacement - 替换的安全字符，默认为 `_`
 * @return
 */
export const escapeFileName = (
    filename: string,
    replacement = '_'
): string =>
    filename.replace(/[\s\\"*<>;/?:@&=+$,#∙']/g, replacement);

/**
 * 计算可读的文件大小
 * @see https://github.com/taijinlee/humanize/blob/master/humanize.js
 * @param bytes - 文件字节数
 * @param fractionDigits - 最终结果保留位数
 * @return
 */
export const humanizeFilesize = (
    bytes: number,
    fractionDigits = 0
): string => {
    const units = ['bytes', 'KB', 'MB', 'GB'];
    const kilo = 1024;
    const sizeBytes = bytes < 0 ? 0 : bytes;
    let unit = 0;
    for (let i = 0; i < units.length; i++) {
        unit = i;
        if (sizeBytes < Math.pow(kilo, i + 1)) {
            break;
        }
    }
    const humanized = (sizeBytes / Math.pow(kilo, unit)).toFixed(fractionDigits);
    return `${ humanized } ${ units[unit] }`;
};

