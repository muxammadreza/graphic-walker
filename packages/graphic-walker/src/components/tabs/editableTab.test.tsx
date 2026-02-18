import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { fireEvent, render } from '@testing-library/react';
import * as ReactI18next from 'react-i18next';
import EditableTabs, { type ITabOption } from './editableTab';

void vi.mock('../removeConfirm', () => ({
    default: () => null,
}));

if (typeof window === 'undefined') {
    GlobalRegistrator.register();
}

class ResizeObserverMock {
    observe = vi.fn();
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn(() => []);
}

describe('EditableTabs slider wheel handling', () => {
    beforeEach(() => {
        vi.spyOn(ReactI18next, 'useTranslation').mockReturnValue({
            t: (key: string) => key,
            i18n: {} as never,
            ready: true,
        } as never);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const tabs: ITabOption[] = [
        { key: 'a', label: 'A', editable: false },
        { key: 'b', label: 'B', editable: false },
        { key: 'c', label: 'C', editable: false },
    ];

    const renderSlider = () => {
        const { container } = render(
            <EditableTabs
                tabs={tabs}
                selectedKey="a"
                onSelected={vi.fn()}
            />,
        );

        const sliderOuter = container.querySelector('div[style*="overflow-x: clip"]') as HTMLDivElement | null;
        if (!sliderOuter) {
            throw new Error('Slider outer container not found');
        }

        const sliderInner = sliderOuter.firstElementChild as HTMLDivElement | null;
        if (!sliderInner) {
            throw new Error('Slider inner container not found');
        }

        Object.defineProperty(sliderOuter, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({ x: 0, y: 0, top: 0, left: 0, right: 100, bottom: 20, width: 100, height: 20, toJSON: () => ({}) }),
        });

        Object.defineProperty(sliderInner, 'getBoundingClientRect', {
            configurable: true,
            value: () => ({ x: 0, y: 0, top: 0, left: 0, right: 300, bottom: 20, width: 300, height: 20, toJSON: () => ({}) }),
        });

        return { sliderOuter, sliderInner };
    };

    it('applies one wheel delta per scroll event', () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

        const { sliderOuter, sliderInner } = renderSlider();

        fireEvent.wheel(sliderOuter, { deltaY: 10, deltaX: 0 });

        expect(sliderInner.style.left).toBe('-10px');

        globalThis.ResizeObserver = originalResizeObserver;
    });

    it('clamps wheel scrolling to maximum content overflow width', () => {
        const originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

        const { sliderOuter, sliderInner } = renderSlider();

        fireEvent.wheel(sliderOuter, { deltaY: 500, deltaX: 0 });

        expect(sliderInner.style.left).toBe('-200px');

        globalThis.ResizeObserver = originalResizeObserver;
    });
});
