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
    readonly x509?: IX509Config;
    readonly timeoutMs?: number;
    readonly db: string;
    readonly authSource?: string;
    readonly authMechanism?: AuthMechanism;
    readonly ssl?: boolean;
    readonly retryWrites?: boolean;
    readonly srv?: boolean;
}

export const ObjectId = Types.ObjectId;

export type ObjectId = Types.ObjectId | MongodbObjectId;

export type MongoId = ObjectId | string;
