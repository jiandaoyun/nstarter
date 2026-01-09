/**
 * 流处理工具类
 */

import { Transform } from 'node:stream';

/**
 * 统计流数据大小的 Transform 流
 */
export class MetricsTransform extends Transform {
    private bytesTransferred: number;

    constructor() {
        super();
        this.bytesTransferred = 0;
    }

    public _transform(chunk: Buffer, encoding: string, callback: () => void): void {
        this.bytesTransferred += chunk.length;
        this.push(chunk);
        callback();
    }

    /**
     * 获取已传输的字节数
     * @returns 已传输的字节数
     */
    public getBytesTransferred(): number {
        return this.bytesTransferred;
    }
}

