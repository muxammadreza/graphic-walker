import React from 'react';
import { describe, expect, it, vi } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { act, render, waitFor } from '@testing-library/react';

if (typeof window === 'undefined') {
    GlobalRegistrator.register();
}

type Deferred<T> = {
    promise: Promise<T>;
    resolve: (value: T) => void;
    reject: (error?: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void;
    let reject!: (error?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

const embedMock = vi.fn();

void vi.mock('vega-embed', () => ({
    default: embedMock,
}));

void vi.mock('../lib/vega', () => ({
    toVegaSpec: () => [
        {
            width: 200,
            height: 120,
            usesVega: false,
        },
    ],
}));

void vi.mock('react-resize-detector', () => ({
    useResizeDetector: () => ({ width: 200, height: 120, ref: vi.fn() }),
}));

void vi.mock('../utils/vegaApiExport', () => ({
    useVegaExportApi: vi.fn(),
}));

void vi.mock('../utils/reportError', () => ({
    Errors: { canvasExceedSize: 'canvasExceedSize' },
    useReporter: () => ({ reportError: vi.fn() }),
}));

import ReactVega from './react-vega';

describe('ReactVega async cleanup', () => {
    it('finalizes embedded view when unmounted before embed promise resolves', async () => {
        const deferred = createDeferred<any>();
        embedMock.mockImplementation(() => deferred.promise);

        const { unmount } = render(
            <ReactVega
                instanceID="inst-1"
                rows={[]}
                columns={[]}
                dataSource={[]}
                stack="stack"
                interactiveScale={false}
                geomType="bar"
                showActions={false}
                layoutMode="auto"
                width={200}
                height={120}
                vegaConfig={{}}
                onGeomClick={vi.fn()}
            />,
        );

        unmount();

        const container = document.createElement('div');
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 120;
        canvas.style.width = '200px';
        canvas.style.height = '120px';
        container.appendChild(canvas);

        const finalize = vi.fn();
        const view = {
            container: () => container,
            width: () => 200,
            height: () => 120,
            runAsync: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addSignalListener: vi.fn(),
            removeSignalListener: vi.fn(),
            signal: vi.fn(() => 0),
        };

        await act(async () => {
            deferred.resolve({ view, finalize });
            await Promise.resolve();
        });

        expect(finalize).toHaveBeenCalledTimes(1);
    });

    it('does not forward click-selection events across different component instances', async () => {
        const embedded: Array<{
            clickListener?: (event: unknown) => void;
            selectionListener?: (name: string, values: unknown) => void;
        }> = [];

        embedMock.mockImplementation(() => {
            const listeners: {
                clickListener?: (event: unknown) => void;
                selectionListener?: (name: string, values: unknown) => void;
            } = {};

            const container = document.createElement('div');
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 120;
            canvas.style.width = '200px';
            canvas.style.height = '120px';
            container.appendChild(canvas);

            const view = {
                container: () => container,
                width: () => 200,
                height: () => 120,
                runAsync: vi.fn(),
                addEventListener: vi.fn((name: string, listener: (event: unknown) => void) => {
                    if (name === 'click') {
                        listeners.clickListener = listener;
                    }
                }),
                removeEventListener: vi.fn(),
                addSignalListener: vi.fn((name: string, listener: (signalName: string, values: unknown) => void) => {
                    if (name === 'geom') {
                        listeners.selectionListener = listener;
                    }
                }),
                removeSignalListener: vi.fn(),
                signal: vi.fn(() => 0),
            };

            embedded.push(listeners);
            return Promise.resolve({ view, finalize: vi.fn() });
        });

        const onGeomClickA = vi.fn();
        const onGeomClickB = vi.fn();

        render(
            <>
                <ReactVega
                    instanceID="inst-a"
                    rows={[]}
                    columns={[]}
                    dataSource={[]}
                    stack="stack"
                    interactiveScale={false}
                    geomType="bar"
                    showActions={false}
                    layoutMode="auto"
                    width={200}
                    height={120}
                    vegaConfig={{}}
                    onGeomClick={onGeomClickA}
                />
                <ReactVega
                    instanceID="inst-b"
                    rows={[]}
                    columns={[]}
                    dataSource={[]}
                    stack="stack"
                    interactiveScale={false}
                    geomType="bar"
                    showActions={false}
                    layoutMode="auto"
                    width={200}
                    height={120}
                    vegaConfig={{}}
                    onGeomClick={onGeomClickB}
                />
            </>,
        );

        await waitFor(() => {
            expect(embedded.length).toBe(2);
            expect(embedded[0]?.clickListener).toBeTruthy();
            expect(embedded[0]?.selectionListener).toBeTruthy();
        });

        await act(async () => {
            embedded[0]?.clickListener?.({ type: 'click' });
            embedded[0]?.selectionListener?.('geom', { key: 'value' });
            await Promise.resolve();
        });

        expect(onGeomClickA).toHaveBeenCalledTimes(1);
        expect(onGeomClickB).toHaveBeenCalledTimes(0);
    });
});
