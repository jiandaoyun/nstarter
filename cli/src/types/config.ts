export interface IToolConf {
    template: {
        [key: string]: string | null
    };
}

export type configKey = string | undefined;
export type configValue = string | undefined;
