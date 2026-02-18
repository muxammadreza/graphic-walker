import React from 'react';
import { describe, expect, it, vi } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { render, waitFor } from '@testing-library/react';

if (typeof window === 'undefined') {
    GlobalRegistrator.register();
}

const plotMock = vi.fn();

void vi.mock('@observablehq/plot', () => ({
    plot: plotMock,
}));

void vi.mock('react-resize-detector', () => ({
    useResizeDetector: () => ({ width: 300, height: 200, ref: vi.fn() }),
}));

void vi.mock('@/lib/observablePlot', () => ({
    toObservablePlotSpec: () => [{ marks: [] }],
}));

void vi.mock('../utils/reportError', () => ({
    Errors: { canvasExceedSize: 'canvasExceedSize' },
    useReporter: () => ({ reportError: vi.fn() }),
}));

import ObservablePlotRenderer from './observable-plot-renderer';

describe('ObservablePlotRenderer imperative API', () => {
    it('supports downloadSVG when using a callback ref', async () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 300 200');
        plotMock.mockImplementation(() => svg);

        let api: any = null;

        render(
            <ObservablePlotRenderer
                ref={(value) => {
                    api = value;
                }}
                rows={[{ fid: 'row', analyticType: 'dimension' } as any]}
                columns={[]}
                dataSource={[]}
                stack="stack"
                interactiveScale={false}
                geomType="bar"
                showActions={false}
                layoutMode="auto"
                width={300}
                height={200}
                vegaConfig={{}}
                useSvg
            />,
        );

        await waitFor(() => {
            expect(api).toBeTruthy();
        });

        const svgData = await api.getSVGData();
        const downloaded = await api.downloadSVG();

        expect(svgData.length).toBeGreaterThan(0);
        expect(downloaded).toEqual(svgData);
    });
});
