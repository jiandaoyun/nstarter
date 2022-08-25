/**
 * 数字处理工具方法
 */

/**
 * 转化为数字类型
 * @param value
 */
const parseNumber = (value: any) => {
    const number = parseFloat(value);
    if (!isNaN(number) && isFinite(number)) {
        return number;
    }
    return null;
};

/**
 * 基于时间生成应用排序序号
 * @param {number} time - 序号基准时间
 * @return {number} - 应用排序序号
 * @author kyle
 */
export const getAppSeq = (
    time: number = Date.now()
): number => Math.floor(time / 1000);
