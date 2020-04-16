export function once(func: any) {
    let result: any;
    let fc: any = func;
    let n = 2;
    return function (this: any, ...args: any[]) {
        if (--n > 0) {
            result = fc.apply(this, args)
        }
        if (n <= 1) {
            fc = undefined
        }
        return result;
    }
}