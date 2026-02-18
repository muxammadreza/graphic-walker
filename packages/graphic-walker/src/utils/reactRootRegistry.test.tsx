import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'bun:test';

const createRootSpy = vi.fn();

void vi.mock('react-dom/client', () => ({
    createRoot: createRootSpy,
}));

import { createEmbeddedRootOptions, renderEmbeddedNode, unmountEmbeddedRoot } from './reactRootRegistry';

describe('reactRootRegistry', () => {
    beforeEach(() => {
        createRootSpy.mockReset();
        createRootSpy.mockImplementation(() => ({
            render: vi.fn(),
            unmount: vi.fn(),
        }));
    });

    it('reuses the same root instance for repeated renders on one container', () => {
        const dom = {} as HTMLElement;

        renderEmbeddedNode(dom, <div>first</div>);
        renderEmbeddedNode(dom, <div>second</div>);

        expect(createRootSpy).toHaveBeenCalledTimes(1);

        const firstRoot = createRootSpy.mock.results[0]?.value as { render: ReturnType<typeof vi.fn> };
        expect(firstRoot.render).toHaveBeenCalledTimes(2);
    });

    it('creates React 19 root options with error callbacks and identifier prefix', () => {
        const options = createEmbeddedRootOptions('embed');
        const error = new Error('render failed');

        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});

        expect(options.identifierPrefix).toBe('gw-embed-');
        expect(options.onCaughtError).toBeDefined();
        expect(options.onUncaughtError).toBeDefined();
        expect(options.onRecoverableError).toBeDefined();

        const onCaughtError = options.onCaughtError;
        const onUncaughtError = options.onUncaughtError;
        const onRecoverableError = options.onRecoverableError;

        if (!onCaughtError || !onUncaughtError || !onRecoverableError) {
            throw new Error('Expected all React root error handlers to be defined');
        }

        const errorInfo = { componentStack: 'at EmbeddedRoot' } as Parameters<typeof onCaughtError>[1];

        onCaughtError(error, errorInfo);
        onUncaughtError(error, errorInfo);
        onRecoverableError(error, errorInfo);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
        expect(consoleDebugSpy).toHaveBeenCalledTimes(1);

        consoleErrorSpy.mockRestore();
        consoleDebugSpy.mockRestore();
    });

    it('unmounts and drops root so the next render creates a new root', () => {
        const dom = {} as HTMLElement;

        renderEmbeddedNode(dom, <div>first</div>);

        const firstRoot = createRootSpy.mock.results[0]?.value as { unmount: ReturnType<typeof vi.fn> };
        unmountEmbeddedRoot(dom);

        expect(firstRoot.unmount).toHaveBeenCalledTimes(1);

        renderEmbeddedNode(dom, <div>second</div>);
        expect(createRootSpy).toHaveBeenCalledTimes(2);
    });
});
