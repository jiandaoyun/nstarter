/**
 * 延迟函数
 * @param ms 延迟毫秒数
 */
export function delay(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
