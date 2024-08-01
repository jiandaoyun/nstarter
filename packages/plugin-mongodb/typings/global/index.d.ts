
interface Constructor<T = any> {
    new(...args: any[]): T;
    name: string;
}
