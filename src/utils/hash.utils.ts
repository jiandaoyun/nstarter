/**
 * 哈希处理工具方法
 */

import crypto from 'crypto';

/**
 * 计算 SHA-1 哈希
 * @param {string} content - 原始内容
 * @return {string} - 哈希
 * @author sean
 */
export const sha1Hex = (content: string): string => crypto
    .createHash('sha1')
    .update(content, 'utf8')
    .digest('hex');
