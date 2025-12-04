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
        it('should generate valid 32-char hex string', () => {
            const traceId = generateTraceId();
            expect(traceId).to.match(/^[0-9a-f]{32}$/);
            expect(traceId).to.not.equal('00000000000000000000000000000000');
        });

        it('should generate unique trace IDs', () => {
            const id1 = generateTraceId();
            const id2 = generateTraceId();
            expect(id1).to.not.equal(id2);
        });
    });

    describe('generateSpanId', () => {
        it('should generate valid 16-char hex string', () => {
            const spanId = generateSpanId();
            expect(spanId).to.match(/^[0-9a-f]{16}$/);
            expect(spanId).to.not.equal('0000000000000000');
        });

        it('should generate unique span IDs', () => {
            const id1 = generateSpanId();
            const id2 = generateSpanId();
            expect(id1).to.not.equal(id2);
        });
    });

    describe('isValidTraceId', () => {
        it('should validate correct trace ID', () => {
            expect(isValidTraceId('0af7651916cd43dd8448eb211c80319c')).to.be.true;
            expect(isValidTraceId('FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF')).to.be.true;
        });

        it('should reject invalid trace IDs', () => {
            expect(isValidTraceId('00000000000000000000000000000000')).to.be.false; // all zeros
            expect(isValidTraceId('0af7651916cd43dd8448eb211c80319')).to.be.false;  // too short
            expect(isValidTraceId('0af7651916cd43dd8448eb211c80319caa')).to.be.false; // too long
            expect(isValidTraceId('0af7651916cd43dd8448eb211c80319g')).to.be.false; // invalid char
            expect(isValidTraceId('')).to.be.false; // empty
        });
    });

    describe('isValidSpanId', () => {
        it('should validate correct span ID', () => {
            expect(isValidSpanId('b7ad6b7169203331')).to.be.true;
            expect(isValidSpanId('FFFFFFFFFFFFFFFF')).to.be.true;
        });

        it('should reject invalid span IDs', () => {
            expect(isValidSpanId('0000000000000000')).to.be.false; // all zeros
            expect(isValidSpanId('b7ad6b716920333')).to.be.false;  // too short
            expect(isValidSpanId('b7ad6b7169203331aa')).to.be.false; // too long
            expect(isValidSpanId('b7ad6b716920333g')).to.be.false; // invalid char
            expect(isValidSpanId('')).to.be.false; // empty
        });
    });

    describe('generateTraceParent', () => {
        it('should generate valid traceparent with default options', () => {
            const traceparent = generateTraceParent();
            expect(traceparent).to.match(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
        });

        it('should generate valid traceparent with sampled=false', () => {
            const traceparent = generateTraceParent({ sampled: false });
            expect(traceparent).to.match(/^00-[0-9a-f]{32}-[0-9a-f]{16}-00$/);
        });

        it('should use custom trace ID and parent ID', () => {
            const traceId = '0af7651916cd43dd8448eb211c80319c';
            const parentId = 'b7ad6b7169203331';
            const traceparent = generateTraceParent({ traceId, parentId });
            expect(traceparent).to.equal(`00-${ traceId }-${ parentId }-01`);
        });

        it('should throw error for invalid trace ID', () => {
            expect(() => {
                generateTraceParent({ traceId: '00000000000000000000000000000000' });
            }).to.throw('Invalid trace ID');
        });

        it('should throw error for invalid span ID', () => {
            expect(() => {
                generateTraceParent({ parentId: '0000000000000000' });
            }).to.throw('Invalid span ID');
        });
    });

    describe('parseTraceParent', () => {
        it('should parse valid traceparent', () => {
            const traceparent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';
            const parsed = parseTraceParent(traceparent);

            expect(parsed).to.not.be.null;
            expect(parsed?.version).to.equal('00');
            expect(parsed?.traceId).to.equal('0af7651916cd43dd8448eb211c80319c');
            expect(parsed?.parentId).to.equal('b7ad6b7169203331');
            expect(parsed?.traceFlags).to.equal('01');
        });

        it('should normalize to lowercase', () => {
            const traceparent = '00-0AF7651916CD43DD8448EB211C80319C-B7AD6B7169203331-01';
            const parsed = parseTraceParent(traceparent);

            expect(parsed?.traceId).to.equal('0af7651916cd43dd8448eb211c80319c');
            expect(parsed?.parentId).to.equal('b7ad6b7169203331');
        });

        it('should return null for invalid traceparents', () => {
            expect(parseTraceParent('')).to.be.null;
            expect(parseTraceParent('invalid')).to.be.null;
            expect(parseTraceParent('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331')).to.be.null; // missing flags
            expect(parseTraceParent('01-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')).to.be.null; // unsupported version
            expect(parseTraceParent('00-00000000000000000000000000000000-b7ad6b7169203331-01')).to.be.null; // all-zero trace ID
            expect(parseTraceParent('00-0af7651916cd43dd8448eb211c80319c-0000000000000000-01')).to.be.null; // all-zero span ID
        });

        it('should handle whitespace', () => {
            const traceparent = '  00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01  ';
            const parsed = parseTraceParent(traceparent);
            expect(parsed).to.not.be.null;
        });
    });

    describe('isValidTraceParent', () => {
        it('should validate correct traceparents', () => {
            expect(isValidTraceParent('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')).to.be.true;
            expect(isValidTraceParent('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00')).to.be.true;
        });

        it('should reject invalid traceparents', () => {
            expect(isValidTraceParent('')).to.be.false;
            expect(isValidTraceParent('invalid')).to.be.false;
            expect(isValidTraceParent('00-invalid-b7ad6b7169203331-01')).to.be.false;
        });
    });

    describe('createChildSpan', () => {
        it('should create child span with same trace ID', () => {
            const parent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';
            const child = createChildSpan(parent);

            const parentParsed = parseTraceParent(parent);
            const childParsed = parseTraceParent(child);

            expect(childParsed?.traceId).to.equal(parentParsed?.traceId);
            expect(childParsed?.parentId).to.not.equal(parentParsed?.parentId); // different span ID
            expect(childParsed?.traceFlags).to.equal('01'); // inherit sampled flag
        });

        it('should inherit parent sampling decision', () => {
            const sampledParent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';
            const unsampledParent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00';

            const sampledChild = createChildSpan(sampledParent);
            const unsampledChild = createChildSpan(unsampledParent);

            expect(parseTraceParent(sampledChild)?.traceFlags).to.equal('01');
            expect(parseTraceParent(unsampledChild)?.traceFlags).to.equal('00');
        });

        it('should allow overriding sampling decision', () => {
            const parent = '00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01';
            const child = createChildSpan(parent, false);

            expect(parseTraceParent(child)?.traceFlags).to.equal('00');
        });

        it('should throw error for invalid parent', () => {
            expect(() => {
                createChildSpan('invalid-traceparent');
            }).to.throw('Invalid parent traceparent');
        });
    });

    describe('isSampled', () => {
        it('should detect sampled traceparent', () => {
            expect(isSampled('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01')).to.be.true;
        });

        it('should detect unsampled traceparent', () => {
            expect(isSampled('00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00')).to.be.false;
        });

        it('should return false for invalid traceparent', () => {
            expect(isSampled('invalid')).to.be.false;
        });
    });

    describe('TraceContext class', () => {
        it('should provide all utility methods', () => {
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

        it('should work correctly through class methods', () => {
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
        it('should support full distributed tracing flow', () => {
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

        it('should handle W3C specification example', () => {
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

