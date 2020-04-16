export function once(func: Function) {
    let result: any;
    let fc: any = func;
    let n = 2;
    return function (this: Function, ...args: any[]) {
        if (--n > 0) {
            result = fc.apply(this, args)
        }
        if (n <= 1) {
            fc = undefined
        }
        return result;
    }
}