/**
 * 控制台日志记录器测试
 */

import { expect } from 'chai';
import { ConsoleLogger } from '../../src/logger/console.logger';
import { LogLevel } from '../../src/logger/base';

describe('ConsoleLogger', () => {
    let originalConsole: {
        debug: typeof console.debug;
        info: typeof console.info;
        warn: typeof console.warn;
        error: typeof console.error;
    };

    let logs: { level: string; message: string }[];

    beforeEach(() => {
        // 保存原始的 console 方法
        originalConsole = {
            debug: console.debug,
            info: console.info,
            warn: console.warn,
            error: console.error
        };

        // Mock console 方法来捕获日志
        logs = [];
        console.debug = (message: string) => logs.push({ level: 'debug', message });
        console.info = (message: string) => logs.push({ level: 'info', message });
        console.warn = (message: string) => logs.push({ level: 'warn', message });
        console.error = (message: string) => logs.push({ level: 'error', message });
    });

    afterEach(() => {
        // 恢复原始的 console 方法
        console.debug = originalConsole.debug;
        console.info = originalConsole.info;
        console.warn = originalConsole.warn;
        console.error = originalConsole.error;
    });

    describe('构造函数', () => {
        it('应该使用默认日志级别 INFO 创建', () => {
            const logger = new ConsoleLogger();
            expect(logger.getMinLevel()).to.equal(LogLevel.INFO);
        });

        it('应该使用指定的日志级别创建', () => {
            const logger = new ConsoleLogger(LogLevel.DEBUG);
            expect(logger.getMinLevel()).to.equal(LogLevel.DEBUG);
        });
    });

    describe('debug', () => {
        it('应该在日志级别为 DEBUG 时输出 debug 日志', () => {
            const logger = new ConsoleLogger(LogLevel.DEBUG);
            logger.debug('Debug message');

            expect(logs).to.have.lengthOf(1);
            expect(logs[0].level).to.equal('debug');
            expect(logs[0].message).to.include('DEBUG');
            expect(logs[0].message).to.include('Debug message');
        });

        it('应该在日志级别为 INFO 时不输出 debug 日志', () => {
            const logger = new ConsoleLogger(LogLevel.INFO);
            logger.debug('Debug message');

            expect(logs).to.have.lengthOf(0);
        });

        it('应该正确格式化带有元数据的日志', () => {
            const logger = new ConsoleLogger(LogLevel.DEBUG);
            const meta = { userId: 123, action: 'test' };
            logger.debug('Debug message', meta);

            expect(logs).to.have.lengthOf(1);
            expect(logs[0].message).to.include('Debug message');
            expect(logs[0].message).to.include(JSON.stringify(meta));
        });

        it('应该包含时间戳', () => {
            const logger = new ConsoleLogger(LogLevel.DEBUG);
            logger.debug('Debug message');

            expect(logs).to.have.lengthOf(1);
            // 检查是否包含 ISO 格式的时间戳（注意格式中有空格）
            expect(logs[0].message).to.match(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\s*\]/);
        });
    });

    describe('info', () => {
        it('应该在日志级别为 INFO 时输出 info 日志', () => {
            const logger = new ConsoleLogger(LogLevel.INFO);
            logger.info('Info message');

            expect(logs).to.have.lengthOf(1);
            expect(logs[0].level).to.equal('info');
            expect(logs[0].message).to.include('INFO');
            expect(logs[0].message).to.include('Info message');
        });

        it('应该在日志级别为 WARN 时不输出 info 日志', () => {
            const logger = new ConsoleLogger(LogLevel.WARN);
            logger.info('Info message');

            expect(logs).to.have.lengthOf(0);
        });

        it('应该正确格式化带有元数据的日志', () => {
            const logger = new ConsoleLogger(LogLevel.INFO);
            const meta = { requestId: 'abc-123' };
            logger.info('Info message', meta);

            expect(logs).to.have.lengthOf(1);
            expect(logs[0].message).to.include('Info message');
            expect(logs[0].message).to.include(JSON.stringify(meta));
        });
    });

    describe('warn', () => {
        it('应该在日志级别为 WARN 时输出 warn 日志', () => {
            const logger = new ConsoleLogger(LogLevel.WARN);
            logger.warn('Warning message');

            expect(logs).to.have.lengthOf(1);
            expect(logs[0].level).to.equal('warn');
            expect(logs[0].message).to.include('WARN');
            expect(logs[0].message).to.include('Warning message');
        });

        it('应该在日志级别为 ERROR 时不输出 warn 日志', () => {
            const logger = new ConsoleLogger(LogLevel.ERROR);
            logger.warn('Warning message');

            expect(logs).to.have.lengthOf(0);
        });

        it('应该正确格式化带有元数据的日志', () => {
            const logger = new ConsoleLogger(LogLevel.WARN);
            const meta = { code: 'DEPRECATED' };
            logger.warn('Warning message', meta);

            expect(logs).to.have.lengthOf(1);
            expect(logs[0].message).to.include('Warning message');
            expect(logs[0].message).to.include(JSON.stringify(meta));
        });
    });

    describe('error', () => {
        it('应该在任何日志级别时都输出 error 日志', () => {
            const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];

            for (const level of levels) {
                logs = [];
                const logger = new ConsoleLogger(level);
                logger.error('Error message');

                expect(logs).to.have.lengthOf(1);
                expect(logs[0].level).to.equal('error');
                expect(logs[0].message).to.include('ERROR');
                expect(logs[0].message).to.include('Error message');
            }
        });

        it('应该正确格式化带有元数据的日志', () => {
            const logger = new ConsoleLogger(LogLevel.ERROR);
            const meta = { errorCode: 500, stack: 'Error stack' };
            logger.error('Error message', meta);

            expect(logs).to.have.lengthOf(1);
            expect(logs[0].message).to.include('Error message');
            expect(logs[0].message).to.include(JSON.stringify(meta));
        });
    });

    describe('日志级别过滤', () => {
        it('应该根据日志级别正确过滤日志', () => {
            const logger = new ConsoleLogger(LogLevel.WARN);

            logger.debug('Debug message');
            logger.info('Info message');
            logger.warn('Warning message');
            logger.error('Error message');

            // 只应该记录 WARN 和 ERROR
            expect(logs).to.have.lengthOf(2);
            expect(logs[0].level).to.equal('warn');
            expect(logs[1].level).to.equal('error');
        });

        it('应该在日志级别为 DEBUG 时记录所有日志', () => {
            const logger = new ConsoleLogger(LogLevel.DEBUG);

            logger.debug('Debug message');
            logger.info('Info message');
            logger.warn('Warning message');
            logger.error('Error message');

            expect(logs).to.have.lengthOf(4);
        });
    });

    describe('日志格式', () => {
        it('应该包含所有必要的组件', () => {
            const logger = new ConsoleLogger(LogLevel.INFO);
            logger.info('Test message');

            expect(logs).to.have.lengthOf(1);
            const message = logs[0].message;

            // 检查格式: [timestamp] [LEVEL] message
            expect(message).to.match(/^\[.*\] \[INFO\] Test message$/);
        });

        it('应该正确处理不带元数据的日志', () => {
            const logger = new ConsoleLogger(LogLevel.INFO);
            logger.info('Simple message');

            expect(logs).to.have.lengthOf(1);
            expect(logs[0].message).to.not.include('undefined');
            expect(logs[0].message).to.not.include('null');
        });

        it('应该正确处理空对象元数据', () => {
            const logger = new ConsoleLogger(LogLevel.INFO);
            logger.info('Message with empty meta', {});

            expect(logs).to.have.lengthOf(1);
            expect(logs[0].message).to.include('{}');
        });

        it('应该正确处理复杂的元数据对象', () => {
            const logger = new ConsoleLogger(LogLevel.INFO);
            const meta = {
                nested: { key: 'value' },
                array: [1, 2, 3],
                number: 123,
                boolean: true
            };
            logger.info('Complex meta', meta);

            expect(logs).to.have.lengthOf(1);
            expect(logs[0].message).to.include(JSON.stringify(meta));
        });
    });
});

