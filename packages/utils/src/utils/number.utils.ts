/**
 * 数字处理工具方法
 */

/**
 * 转化为数字类型
 * @param value
 */
export const parseNumber = (value: any) => {
    const number = parseFloat(value);
    if (!isNaN(number) && isFinite(number)) {
        return number;
    }
    return null;
};

/**
 * Check if `value` is a safe integer.
 * @param value
 */
export const isSafeInteger = (value?: number): value is number => {
    return Number.isSafeInteger(value);
};
