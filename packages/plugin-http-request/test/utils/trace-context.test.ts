/**
 * W3C Trace Context 工具测试
 */

import { expect } from 'chai';
import {
    generateTraceId,
    generateSpanId,
    generateTraceParent,
    parseTraceParent,
    isValidTraceParent,
    isValidTraceId,
    isValidSpanId,
    createChildSpan,
    isSampled,
    TraceContext
} from '../../src/utils/trace.context';

describe('TraceContext Utils', () => {
    describe('generateTraceId', () => {
        it('应该生成有效的 32 位十六进制字符串', () => {
            const traceId = generateTraceId();
            expect(traceId).to.match(/^[0-9a-f]{32}$/);
            expect(traceId).to.not.equal('00000000000000000000000000000000');
        });

        it('应该生成唯一的跟踪 ID', () => {
            const id1 = generateTraceId();
            const id2 = generateTraceId();
            expect(id1).to.not.equal(id2);
        });
    });

    describe('generateSpanId', () => {
        it('应该生成有效的 16 位十六进制字符串', () => {
            const spanId = generateSpanId();
            expect(spanId).to.match(/^[0-9a-f]{16}$/);
            expect(spanId).to.not.equal('0000000000000000');
        });

        it('应该生成唯一的跨度 ID', () => {
            const id1 = generateSpanId();
            const id2 = generateSpanId();
            expect(id1).to.not.equal(id2);
        });
    });

    describe('isValidTraceId', () => {
        it('应该验证正确的跟踪 ID', () => {
            expect(isValidTraceId('0af7651916cd43dd8448eb211c80319c')).to.be.true;
            expect(isValidTraceId('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).to.be.true;
        });

        it('应该拒绝无效的跟踪 ID', () => {
            expect(isValidTraceId('00000000000000000000000000000000')).to.be.false; // all zeros
            expect(isValidTraceId('0af7651916cd43dd8448eb211c80319')).to.be.false;  // too short
            expect(isValidTraceId('0af7651916cd43dd8448eb211c80319caa')).to.be.false; // too long
            expect(isValidTraceId('0af7651916cd43dd8448eb211c80319g')).to.be.false; // invalid char
            expect(isValidTraceId('')).to.be.false; // empty
        });
    });

    describe('isValidSpanId', () => {
        it('应该验证正确的跨度 ID', () => {
            expect(isValidSpanId('b7ad6b7169203331')).to.be.true;
            expect(isValidSpanId('FFFFFFFFFFFFFFFF')).to.be.true;
        });

        it('应该拒绝无效的跨度 ID', () => {
            expect(isValidSpanId('0000000000000000')).to.be.false; // all zeros
            expect(isValidSpanId('b7ad6b716920333')).to.be.false;  // too short
            expect(isValidSpanId('b7ad6b7169203331aa')).to.be.false; // too long
            expect(isValidSpanId('b7ad6b716920333g')).to.be.false; // invalid char
            expect(isValidSpanId('')).to.be.false; // empty
        });
    });

    describe('generateTraceParent', () => {
        it('应该使用默认选项生成有效的 traceparent', () => {
            const traceparent = generateTraceParent();
            expect(traceparent).to.match(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
        });

        it('应该生成未采样的有效 traceparent（sampled=false）', () => {
            const traceparent = generateTraceParent({ sampled: false });
            expect(traceparent).to.match(/^00-[0-9a-f]{32}-[0-9a-f]{16}-00$/);
        });

        it('应该使用自定义跟踪 ID 和父 ID', () => {
            const traceId = '0af7651916cd43dd8448eb211c80319c';
            const parentId = 'b7ad6b7169203331';
            const traceparent = generateTraceParent({ traceId, parentId });
            expect(traceparent).to.equal(`00-${ traceId }-${ parentId }-01`);
        });

        it('应该为无效的跟踪 ID 抛出错误', () => {
            expect(() => {
                generateTraceParent({ traceId: '00000000000000000000000000000000' });
            }).to.throw('Invalid trace ID');
        });

        it('应该为无效的跨度 ID 抛出错误', () => {
            expect(() => {
                generateTraceParent({ parentId: '0000000000000000' });
            }).to.throw('Invalid span ID');
        });
    });

    describe('parseTraceParent', () => {
        it('应该解析有效的 traceparent', () => {
            const traceparent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';
            const parsed = parseTraceParent(traceparent);

            expect(parsed).to.not.be.null;
            expect(parsed?.version).to.equal('00');
            expect(parsed?.traceId).to.equal('0af7651916cd43dd8448eb211c80319c');
            expect(parsed?.parentId).to.equal('b7ad6b7169203331');
            expect(parsed?.traceFlags).to.equal('01');
        });

        it('应该规范化为小写', () => {
            const traceparent = '00-0AF7651916CD43DD8448EB211C80319C-B7AD6B7169203331-01';
            const parsed = parseTraceParent(traceparent);

            expect(parsed?.traceId).to.equal('0af7651916cd43dd8448eb211c80319c');
            expect(parsed?.parentId).to.equal('b7ad6b7169203331');
        });

        it('应该为无效的 traceparent 返回 null', () => {
            expect(parseTraceParent('')).to.be.null;
            expect(parseTraceParent('invalid')).to.be.null;
            expect(parseTraceParent('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331')).to.be.null; // missing flags
            expect(parseTraceParent('01-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')).to.be.null; // unsupported version
            expect(parseTraceParent('00-00000000000000000000000000000000-b7ad6b7169203331-01')).to.be.null; // all-zero trace ID
            expect(parseTraceParent('00-0af7651916cd43dd8448eb211c80319c-0000000000000000-01')).to.be.null; // all-zero span ID
        });

        it('应该处理空白字符', () => {
            const traceparent = '  00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01  ';
            const parsed = parseTraceParent(traceparent);
            expect(parsed).to.not.be.null;
        });
    });

    describe('isValidTraceParent', () => {
        it('应该验证正确的 traceparent', () => {
            expect(isValidTraceParent('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')).to.be.true;
            expect(isValidTraceParent('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00')).to.be.true;
        });

        it('应该拒绝无效的 traceparent', () => {
            expect(isValidTraceParent('')).to.be.false;
            expect(isValidTraceParent('invalid')).to.be.false;
            expect(isValidTraceParent('00-invalid-b7ad6b7169203331-01')).to.be.false;
        });
    });

    describe('createChildSpan', () => {
        it('应该创建具有相同跟踪 ID 的子跨度', () => {
            const parent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';
            const child = createChildSpan(parent);

            const parentParsed = parseTraceParent(parent);
            const childParsed = parseTraceParent(child);

            expect(childParsed?.traceId).to.equal(parentParsed?.traceId);
            expect(childParsed?.parentId).to.not.equal(parentParsed?.parentId); // different span ID
            expect(childParsed?.traceFlags).to.equal('01'); // inherit sampled flag
        });

        it('应该继承父级的采样决策', () => {
            const sampledParent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';
            const unsampledParent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00';

            const sampledChild = createChildSpan(sampledParent);
            const unsampledChild = createChildSpan(unsampledParent);

            expect(parseTraceParent(sampledChild)?.traceFlags).to.equal('01');
            expect(parseTraceParent(unsampledChild)?.traceFlags).to.equal('00');
        });

        it('应该允许覆盖采样决策', () => {
            const parent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';
            const child = createChildSpan(parent, false);

            expect(parseTraceParent(child)?.traceFlags).to.equal('00');
        });

        it('应该为无效的父级抛出错误', () => {
            expect(() => {
                createChildSpan('invalid-traceparent');
            }).to.throw('Invalid parent traceparent');
        });
    });

    describe('isSampled', () => {
        it('应该检测已采样的 traceparent', () => {
            expect(isSampled('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')).to.be.true;
        });

        it('应该检测未采样的 traceparent', () => {
            expect(isSampled('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00')).to.be.false;
        });

        it('应该为无效的 traceparent 返回 false', () => {
            expect(isSampled('invalid')).to.be.false;
        });
    });

    describe('TraceContext class', () => {
        it('应该提供所有工具方法', () => {
            expect(typeof TraceContext.generate).to.equal('function');
            expect(typeof TraceContext.parse).to.equal('function');
            expect(typeof TraceContext.isValid).to.equal('function');
            expect(typeof TraceContext.createChild).to.equal('function');
            expect(typeof TraceContext.isSampled).to.equal('function');
            expect(typeof TraceContext.generateTraceId).to.equal('function');
            expect(typeof TraceContext.generateSpanId).to.equal('function');
            expect(typeof TraceContext.isValidTraceId).to.equal('function');
            expect(typeof TraceContext.isValidSpanId).to.equal('function');
        });

        it('应该通过类方法正确工作', () => {
            const traceparent = TraceContext.generate();
            expect(TraceContext.isValid(traceparent)).to.be.true;
            expect(TraceContext.isSampled(traceparent)).to.be.true;

            const parsed = TraceContext.parse(traceparent);
            expect(parsed).to.not.be.null;

            const child = TraceContext.createChild(traceparent);
            expect(TraceContext.isValid(child)).to.be.true;
        });
    });

    describe('Real-world scenarios', () => {
        it('应该支持完整的分布式跟踪流程', () => {
            // Service A generates initial traceparent
            const serviceATrace = generateTraceParent({ sampled: true });
            expect(isValidTraceParent(serviceATrace)).to.be.true;

            // Service B receives the traceparent and creates a child span
            const serviceBTrace = createChildSpan(serviceATrace);
            expect(isValidTraceParent(serviceBTrace)).to.be.true;

            // Service C receives from Service B and creates another child span
            const serviceCTrace = createChildSpan(serviceBTrace);
            expect(isValidTraceParent(serviceCTrace)).to.be.true;

            // All should share the same trace ID
            const aTrace = parseTraceParent(serviceATrace);
            const bTrace = parseTraceParent(serviceBTrace);
            const cTrace = parseTraceParent(serviceCTrace);

            expect(aTrace?.traceId).to.equal(bTrace?.traceId);
            expect(bTrace?.traceId).to.equal(cTrace?.traceId);

            // But have different span IDs
            expect(aTrace?.parentId).to.not.equal(bTrace?.parentId);
            expect(bTrace?.parentId).to.not.equal(cTrace?.parentId);

            // All should be sampled
            expect(isSampled(serviceATrace)).to.be.true;
            expect(isSampled(serviceBTrace)).to.be.true;
            expect(isSampled(serviceCTrace)).to.be.true;
        });

        it('应该处理 W3C 规范示例', () => {
            // Example from W3C spec
            const exampleTrace = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';

            expect(isValidTraceParent(exampleTrace)).to.be.true;

            const parsed = parseTraceParent(exampleTrace);
            expect(parsed).to.deep.equal({
                version: '00',
                traceId: '0af7651916cd43dd8448eb211c80319c',
                parentId: 'b7ad6b7169203331',
                traceFlags: '01'
            });

            expect(isSampled(exampleTrace)).to.be.true;
        });
    });
});

