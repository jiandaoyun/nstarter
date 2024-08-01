/**
 * 服务注册元数据信息
 */
export interface IServiceMeta {
    id: symbol | string;
    originName: string;
    scope?: string | symbol;
}
