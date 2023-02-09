import { ParsedUrlQueryInput } from 'querystring';
import { AuthMechanism } from 'mongodb';

export interface IMongodbQueryParams extends ParsedUrlQueryInput {
    replicaSet?: string;
}

interface IMongodbServer {
    readonly host: string;
    readonly port?: number;
}

interface IX509Config {
    readonly ca: string;
    readonly cert: string;
    readonly key: string;
}

export interface IMongodbConfig {
    readonly servers: IMongodbServer[];
    readonly replicaSet?: string;
    readonly user?: string;
    readonly password?: string;
    readonly x509?: IX509Config;
    readonly timeoutMs?: number;
    readonly db: string;
    readonly authSource?: string;
    readonly authMechanism?: AuthMechanism;
    readonly ssl?: boolean;
    readonly retryWrites?: boolean;
    readonly srv?: boolean;
}
