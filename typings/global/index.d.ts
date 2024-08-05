
interface Constructor<T = any> {
    new(...args: any[]): T;
    name: string;
}

interface Callback<T = any, E = Error> {
    (err?: E | null, result?: T): void;
}
