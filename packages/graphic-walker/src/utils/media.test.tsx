import { afterEach, describe, expect, it, vi } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { act, renderHook } from '@testing-library/react';
import type { IDarkMode } from '../interfaces';
import { currentMediaTheme, useCurrentMediaTheme } from './media';

GlobalRegistrator.register();

type Listener = (event: MediaQueryListEvent) => void;

function mockMatchMedia(initialMatches: boolean) {
    let matches = initialMatches;
    const listeners = new Set<Listener>();
    const addEventListener = vi.fn((eventName: string, listener: Listener) => {
        if (eventName === 'change') {
            listeners.add(listener);
        }
    });
    const removeEventListener = vi.fn((eventName: string, listener: Listener) => {
        if (eventName === 'change') {
            listeners.delete(listener);
        }
    });

    const mediaQuery = {
        get matches() {
            return matches;
        },
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener,
        removeEventListener,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(() => true),
    } as unknown as MediaQueryList;

    const matchMediaSpy = vi.spyOn(window, 'matchMedia').mockImplementation(() => mediaQuery);

    return {
        addEventListener,
        removeEventListener,
        emit(nextMatches: boolean) {
            matches = nextMatches;
            const event = { matches: nextMatches, media: mediaQuery.media } as MediaQueryListEvent;
            listeners.forEach((listener) => {
                listener(event);
            });
        },
        restore() {
            matchMediaSpy.mockRestore();
        },
    };
}

describe('media theme helpers', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('reads the current media theme from matchMedia', () => {
        const darkMock = mockMatchMedia(true);
        expect(currentMediaTheme()).toBe('dark');
        darkMock.restore();

        const lightMock = mockMatchMedia(false);
        expect(currentMediaTheme()).toBe('light');
        lightMock.restore();
    });

    it('syncs immediately to media preference when switching from explicit mode to media mode', () => {
        const mediaMock = mockMatchMedia(false);

        const { result, rerender } = renderHook(({ mode }: { mode: IDarkMode | undefined }) => useCurrentMediaTheme(mode), {
            initialProps: { mode: 'dark' as IDarkMode },
        });

        expect(result.current).toBe('dark');

        rerender({ mode: 'media' as IDarkMode });

        expect(result.current).toBe('light');

        mediaMock.restore();
    });

    it('subscribes to media changes in media mode and unsubscribes on unmount', () => {
        const mediaMock = mockMatchMedia(false);

        const { result, unmount } = renderHook(() => useCurrentMediaTheme('media'));

        expect(result.current).toBe('light');
        expect(mediaMock.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

        act(() => {
            mediaMock.emit(true);
        });

        expect(result.current).toBe('dark');

        unmount();

        expect(mediaMock.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));

        mediaMock.restore();
    });
});
