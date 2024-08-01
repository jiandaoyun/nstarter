interface Callback<T = any, E = Error> {
    (err?: E | null, result?: T): void;
}
