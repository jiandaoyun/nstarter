export interface IToolConf {
    repos: {
        [key: string]: string | null
    };
}

export type configKey = string | undefined;
export type configValue = string | undefined;
