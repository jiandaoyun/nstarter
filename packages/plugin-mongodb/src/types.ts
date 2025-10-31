import type { ParsedUrlQueryInput } from 'querystring';
import type { AuthMechanism, ObjectId as MongodbObjectId } from 'mongodb';
import { Types } from 'mongoose';

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
    readonly timeoutMs?: number;
    readonly db: string;
    readonly authSource?: string;
    readonly authMechanism?: AuthMechanism;
    readonly tls?: boolean;
    readonly x509?: IX509Config;
    readonly directConnection?: boolean;
    readonly retryWrites?: boolean;
    readonly srv?: boolean;
    readonly useStableAPI?: boolean;
}

export const ObjectId = Types.ObjectId;

export type ObjectId = Types.ObjectId | MongodbObjectId;

export type MongoId = ObjectId | string;
