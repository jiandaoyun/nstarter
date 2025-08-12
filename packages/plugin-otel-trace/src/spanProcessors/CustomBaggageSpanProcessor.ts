import { propagation } from '@opentelemetry/api';
import type { Context, BaggageEntry } from '@opentelemetry/api';
import type { Span, ReadableSpan, SpanProcessor } from '@opentelemetry/sdk-trace-base';

/**
 * A custom span processor that extracts baggage from the parent context
 * and sets it as attributes on the span.
 */
export class CustomBaggageSpanProcessor implements SpanProcessor {
    /**
     * The filter function to determine which baggage entries to include
     * in the span attributes.
     * It takes a tuple of [key, baggageEntry] and returns a boolean.
     * If it returns true, the baggage entry will be included in the span attributes.
     * If it returns false, the baggage entry will be ignored.
     * This allows for selective inclusion of baggage entries based on custom logic.
     * For example, you could filter out sensitive information or only include
     * specific keys that are relevant to the span.
     * This is useful for scenarios where you want to control the amount of baggage
     * data that gets attached to spans, especially in production environments
     * where you might want to avoid logging sensitive or unnecessary information.
     */
    private _filter: (entry: [key: string, baggageEntry: BaggageEntry]) => boolean;

    /**
     * Default filter function that accepts all baggage entries.
     * This can be overridden by passing a custom filter function to the constructor.
     */
    private static defaultFilter = (entry: [key: string, baggageEntry: BaggageEntry]) => true;

    constructor(filter?: (entry: [key: string, baggageEntry: BaggageEntry]) => boolean) {
        this._filter = filter || CustomBaggageSpanProcessor.defaultFilter;
    }

    /**
     * Called when a {@link Span} is started, if the `span.isRecording()`
     * returns true. This method extract baggage from the parent context and set it on the span
     * @param span the Span that just started.
     * @param parentContext the context of the parent span.
     */
    public onStart(span: Span, parentContext: Context): void {
        const baggage = propagation.getBaggage(parentContext);
        if (baggage) {
            baggage.getAllEntries().forEach(([key, baggageEntry]) => {
                if (this._filter([key, baggageEntry])) {
                    span.setAttribute(`baggage.${ key }`, baggageEntry.value);
                }
            });
        }
    }

    public forceFlush(): Promise<void> {
        return Promise.resolve();
    }

    public onEnd(span: ReadableSpan): void {
    }

    public shutdown(): Promise<void> {
        return Promise.resolve();
    }
}
