import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { render } from '@testing-library/react';

void vi.mock('../ui/hover-card', () => ({
    HoverCard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    HoverCardTrigger: React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => <div ref={ref} {...props} />),
    HoverCardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { TruncateDector } from './index';

if (typeof window === 'undefined') {
    GlobalRegistrator.register();
}

type ResizeObserverCallbackType = ConstructorParameters<typeof ResizeObserver>[0];

let resizeObserverCallback: ResizeObserverCallbackType | null = null;

class ResizeObserverMock {
    constructor(callback: ResizeObserverCallbackType) {
        resizeObserverCallback = callback;
    }

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
}

describe('TruncateDector', () => {
    const originalResizeObserver = globalThis.ResizeObserver;
    const offsetWidthDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth');
    const scrollWidthDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollWidth');

    let offsetWidth = 100;
    let scrollWidth = 200;

    beforeEach(() => {
        resizeObserverCallback = null;
        offsetWidth = 100;
        scrollWidth = 200;

        globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

        Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
            configurable: true,
            get() {
                return offsetWidth;
            },
        });

        Object.defineProperty(HTMLElement.prototype, 'scrollWidth', {
            configurable: true,
            get() {
                return scrollWidth;
            },
        });
    });

    afterEach(() => {
        globalThis.ResizeObserver = originalResizeObserver;

        if (offsetWidthDescriptor) {
            Object.defineProperty(HTMLElement.prototype, 'offsetWidth', offsetWidthDescriptor);
        }
        if (scrollWidthDescriptor) {
            Object.defineProperty(HTMLElement.prototype, 'scrollWidth', scrollWidthDescriptor);
        }

        vi.restoreAllMocks();
    });

    it('recomputes truncation state when value changes without requiring a resize event', () => {
        const { rerender, container } = render(<TruncateDector value="this is definitely long" />);

        if (resizeObserverCallback) {
            resizeObserverCallback([], {} as ResizeObserver);
        }

        const longTrigger = container.querySelector('.truncate.block');
        if (!longTrigger) {
            throw new Error('Expected truncation trigger to exist for long value');
        }
        expect(longTrigger.getAttribute('data-truncated')).toBe('true');

        scrollWidth = 80;
        rerender(<TruncateDector value="short" />);

        const shortTrigger = container.querySelector('.truncate.block');
        if (!shortTrigger) {
            throw new Error('Expected truncation trigger to exist for short value');
        }
        expect(shortTrigger.getAttribute('data-truncated')).toBe('false');
    });
});
