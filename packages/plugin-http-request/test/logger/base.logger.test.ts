/**
 * 基础日志记录器测试
 */

import { expect } from 'chai';
import {
    BaseLogger,
    ELogLevel,
    NullLogger
} from '../../src';

// 创建一个具体的实现用于测试
class TestLogger extends BaseLogger {
    public logs: { level: ELogLevel; message: string; meta?: Record<string, any> }[] = [];

    public debug(message: string, meta?: Record<string, any>): void {
        if (this.shouldLog(ELogLevel.DEBUG)) {
            this.logs.push({ level: ELogLevel.DEBUG, message, meta });
        }
    }

    public info(message: string, meta?: Record<string, any>): void {
        if (this.shouldLog(ELogLevel.INFO)) {
            this.logs.push({ level: ELogLevel.INFO, message, meta });
        }
    }

    public warn(message: string, meta?: Record<string, any>): void {
        if (this.shouldLog(ELogLevel.WARN)) {
            this.logs.push({ level: ELogLevel.WARN, message, meta });
        }
    }

    public error(message: string, meta?: Record<string, any>): void {
        if (this.shouldLog(ELogLevel.ERROR)) {
            this.logs.push({ level: ELogLevel.ERROR, message, meta });
        }
    }
}

describe('BaseLogger', () => {
    describe('构造函数', () => {
        it('应该使用默认日志级别 INFO', () => {
            const logger = new TestLogger();
            expect(logger.getMinLevel()).to.equal(ELogLevel.INFO);
        });

        it('应该使用指定的日志级别', () => {
            const logger = new TestLogger(ELogLevel.DEBUG);
            expect(logger.getMinLevel()).to.equal(ELogLevel.DEBUG);
        });

        it('应该支持所有日志级别', () => {
            const levels = [ELogLevel.DEBUG, ELogLevel.INFO, ELogLevel.WARN, ELogLevel.ERROR];

            for (const level of levels) {
                const logger = new TestLogger(level);
                expect(logger.getMinLevel()).to.equal(level);
            }
        });
    });

    describe('setMinLevel', () => {
        it('应该能够更改日志级别', () => {
            const logger = new TestLogger(ELogLevel.INFO);
            expect(logger.getMinLevel()).to.equal(ELogLevel.INFO);

            logger.setMinLevel(ELogLevel.DEBUG);
            expect(logger.getMinLevel()).to.equal(ELogLevel.DEBUG);

            logger.setMinLevel(ELogLevel.ERROR);
            expect(logger.getMinLevel()).to.equal(ELogLevel.ERROR);
        });

        it('应该立即影响日志过滤行为', () => {
            const logger = new TestLogger(ELogLevel.WARN);

            // 初始状态，不应记录 INFO
            logger.info('Info message 1');
            expect(logger.logs).to.have.lengthOf(0);

            // 更改为 INFO 级别
            logger.setMinLevel(ELogLevel.INFO);
            logger.info('Info message 2');
            expect(logger.logs).to.have.lengthOf(1);
            expect(logger.logs[0].message).to.equal('Info message 2');
        });
    });

    describe('getMinLevel', () => {
        it('应该返回当前的最小日志级别', () => {
            const logger = new TestLogger(ELogLevel.WARN);
            expect(logger.getMinLevel()).to.equal(ELogLevel.WARN);
        });

        it('应该反映通过 setMinLevel 的更改', () => {
            const logger = new TestLogger(ELogLevel.INFO);
            expect(logger.getMinLevel()).to.equal(ELogLevel.INFO);

            logger.setMinLevel(ELogLevel.DEBUG);
            expect(logger.getMinLevel()).to.equal(ELogLevel.DEBUG);
        });
    });

    describe('shouldLog', () => {
        it('DEBUG 级别应该记录所有日志', () => {
            const logger = new TestLogger(ELogLevel.DEBUG);

            logger.debug('Debug');
            logger.info('Info');
            logger.warn('Warn');
            logger.error('Error');

            expect(logger.logs).to.have.lengthOf(4);
        });

        it('INFO 级别应该记录 INFO、WARN、ERROR', () => {
            const logger = new TestLogger(ELogLevel.INFO);

            logger.debug('Debug');
            logger.info('Info');
            logger.warn('Warn');
            logger.error('Error');

            expect(logger.logs).to.have.lengthOf(3);
            expect(logger.logs[0].level).to.equal(ELogLevel.INFO);
            expect(logger.logs[1].level).to.equal(ELogLevel.WARN);
            expect(logger.logs[2].level).to.equal(ELogLevel.ERROR);
        });

        it('WARN 级别应该记录 WARN、ERROR', () => {
            const logger = new TestLogger(ELogLevel.WARN);

            logger.debug('Debug');
            logger.info('Info');
            logger.warn('Warn');
            logger.error('Error');

            expect(logger.logs).to.have.lengthOf(2);
            expect(logger.logs[0].level).to.equal(ELogLevel.WARN);
            expect(logger.logs[1].level).to.equal(ELogLevel.ERROR);
        });

        it('ERROR 级别应该只记录 ERROR', () => {
            const logger = new TestLogger(ELogLevel.ERROR);

            logger.debug('Debug');
            logger.info('Info');
            logger.warn('Warn');
            logger.error('Error');

            expect(logger.logs).to.have.lengthOf(1);
            expect(logger.logs[0].level).to.equal(ELogLevel.ERROR);
        });
    });

    describe('日志级别层级', () => {
        it('应该正确实现日志级别的优先级', () => {
            const levels = [ELogLevel.DEBUG, ELogLevel.INFO, ELogLevel.WARN, ELogLevel.ERROR];

            // 验证每个级别都只记录大于等于其优先级的日志
            for (let i = 0; i < levels.length; i++) {
                const logger = new TestLogger(levels[i]);

                logger.debug('Debug');
                logger.info('Info');
                logger.warn('Warn');
                logger.error('Error');

                // 应该记录从当前级别到 ERROR 的所有日志
                expect(logger.logs).to.have.lengthOf(4 - i);
            }
        });
    });

    describe('元数据处理', () => {
        it('应该正确传递元数据', () => {
            const logger = new TestLogger(ELogLevel.DEBUG);
            const meta = { key: 'value', number: 123 };

            logger.info('Test message', meta);

            expect(logger.logs).to.have.lengthOf(1);
            expect(logger.logs[0].meta).to.deep.equal(meta);
        });

        it('应该处理 undefined 元数据', () => {
            const logger = new TestLogger(ELogLevel.DEBUG);

            logger.info('Test message');

            expect(logger.logs).to.have.lengthOf(1);
            expect(logger.logs[0].meta).to.be.undefined;
        });

        it('应该处理空对象元数据', () => {
            const logger = new TestLogger(ELogLevel.DEBUG);

            logger.info('Test message', {});

            expect(logger.logs).to.have.lengthOf(1);
            expect(logger.logs[0].meta).to.deep.equal({});
        });
    });
});

describe('NullLogger', () => {
    it('应该不记录任何 debug 日志', () => {
        const logger = new NullLogger();
        // 不应该抛出错误，也不应该有任何副作用
        expect(() => logger.debug('Debug message')).to.not.throw();
    });

    it('应该不记录任何 info 日志', () => {
        const logger = new NullLogger();
        expect(() => logger.info('Info message')).to.not.throw();
    });

    it('应该不记录任何 warn 日志', () => {
        const logger = new NullLogger();
        expect(() => logger.warn('Warn message')).to.not.throw();
    });

    it('应该不记录任何 error 日志', () => {
        const logger = new NullLogger();
        expect(() => logger.error('Error message')).to.not.throw();
    });

    it('应该接受但忽略元数据', () => {
        const logger = new NullLogger();
        const meta = { key: 'value' };

        expect(() => logger.debug('Message', meta)).to.not.throw();
        expect(() => logger.info('Message', meta)).to.not.throw();
        expect(() => logger.warn('Message', meta)).to.not.throw();
        expect(() => logger.error('Message', meta)).to.not.throw();
    });

    it('应该能被用作 ILogger 接口的实现', () => {
        const logger: any = new NullLogger();

        // 验证实现了所有必需的方法
        expect(logger.debug).to.be.a('function');
        expect(logger.info).to.be.a('function');
        expect(logger.warn).to.be.a('function');
        expect(logger.error).to.be.a('function');
    });
});

describe('ELogLevel 枚举', () => {
    it('应该包含所有日志级别', () => {
        expect(ELogLevel.DEBUG).to.equal('debug');
        expect(ELogLevel.INFO).to.equal('info');
        expect(ELogLevel.WARN).to.equal('warn');
        expect(ELogLevel.ERROR).to.equal('error');
    });

    it('应该有正确的字符串值', () => {
        const levels = Object.values(ELogLevel);
        expect(levels).to.include('debug');
        expect(levels).to.include('info');
        expect(levels).to.include('warn');
        expect(levels).to.include('error');
    });
});

