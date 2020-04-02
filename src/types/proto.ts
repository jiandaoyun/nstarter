import { Options } from '@grpc/proto-loader';

export interface IPackageLoadOptions {
    protoPath: string;
    package: string;
    loader?: Options;
}
