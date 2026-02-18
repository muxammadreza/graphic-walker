import { beforeEach, describe, expect, it, vi } from 'bun:test';
import type { Map } from 'leaflet';
import { observeLeafletMapResize } from './mapResizeObserver';

type ResizeObserverCtor = new (callback: ResizeObserverCallback) => ResizeObserver;

describe('observeLeafletMapResize', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('observes the map container and invalidates map size on resize', () => {
        const observe = vi.fn();
        const disconnect = vi.fn();
        let resizeCallback: ResizeObserverCallback | null = null;

        const ResizeObserverMock: ResizeObserverCtor = class {
            constructor(callback: ResizeObserverCallback) {
                resizeCallback = callback;
            }

            observe = observe;
            disconnect = disconnect;
            unobserve = vi.fn();
            takeRecords = vi.fn(() => []);
        };

        const originalResizeObserver = globalThis.ResizeObserver;
        globalThis.ResizeObserver = ResizeObserverMock;

        const container = {} as HTMLDivElement;
        const map = {
            getContainer: vi.fn(() => container),
            invalidateSize: vi.fn(),
        } as unknown as Map;

        const cleanup = observeLeafletMapResize(map);

        expect(observe).toHaveBeenCalledTimes(1);
        expect(observe).toHaveBeenCalledWith(container);
        expect(map.getContainer).toHaveBeenCalledTimes(1);

        if (resizeCallback) {
            resizeCallback([], {} as ResizeObserver);
        }

        expect(map.invalidateSize).toHaveBeenCalledTimes(1);

        cleanup();
        expect(disconnect).toHaveBeenCalledTimes(1);

        globalThis.ResizeObserver = originalResizeObserver;
    });
});
