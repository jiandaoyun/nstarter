import { ClientSession } from "mongoose";

export abstract class MongodbRepo {
    protected readonly _session?: ClientSession;

    constructor (session?: ClientSession) {
        this._session = session;
    }
}

export interface IRepoRegistry {
    [name: string]: MongodbRepo;
}

const _defaultRepositories: IRepoRegistry = {};

export const repoProvider = <T extends MongodbRepo>(Repository: Constructor<T>, registry: IRepoRegistry = _defaultRepositories) =>
    (sess?: ClientSession): T => {
        if (!sess) {
            const repoKey = Repository.name;
            const repo = registry[repoKey] ??= new Repository();
            return repo as T;
        } else {
            return new Repository(sess);
        }
    };
