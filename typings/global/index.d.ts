
interface Constructor<T = any> {
    new(...args: any[]): T;
    name: string;
}

interface Callback<T = any, E = Error> {
    (err?: E | null, result?: T): void;
}

namespace Express {
    interface Request {
        requestId: string;
        userAgent: string;
        originalPath: string | null;
    }
}
