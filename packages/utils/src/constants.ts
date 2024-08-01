export enum RandomString {
    alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    lower = 'abcdefghijklmnopqrstuvwxyz',
    upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numeric = '1234567890',
    positive = '123456789',
    hex = '1234567890abcdef',
    alpha_numeric = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    lower_numeric = '1234567890abcdefghijklmnopqrstuvwxyz',
    upper_numeric = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ'
}

export const stringTag = '[object String]';
export const numberTag = '[object Number]';
export const objectTag = '[object Object]';

export const objectProto = Object.prototype;
export const funcProto = Function.prototype;
export const nativeObjectToString = objectProto.toString;
export const nativeFunctionToString = funcProto.toString;
