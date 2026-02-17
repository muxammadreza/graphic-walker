import { beforeEach, describe, expect, it, vi } from 'bun:test';
import { mapVegaLiteSpecToChart } from './vlSpecMapper';

const mockVegaliteMapper = vi.fn();
const mockNewChart = vi.fn();

void vi.mock('./vl2gw', () => ({
    VegaliteMapper: (...args: unknown[]) => mockVegaliteMapper(...args),
}));

void vi.mock('../models/visSpecHistory', () => ({
    newChart: (...args: unknown[]) => mockNewChart(...args),
}));

describe('mapVegaLiteSpecToChart', () => {
    beforeEach(() => {
        mockVegaliteMapper.mockReset();
        mockNewChart.mockReset();
        mockNewChart.mockReturnValue({
            encodings: {
                dimensions: [{ fid: 'dimension-a' }],
                measures: [{ fid: 'measure-a' }],
            },
        });
        mockVegaliteMapper.mockReturnValue({ visId: 'mapped-vis' });
    });

    it('passes vlSpec as the mapping source payload', () => {
        const vlSpec = { mark: 'bar', encoding: { x: { field: 'a' }, y: { field: 'b' } } };
        const meta = [{ fid: 'a' }, { fid: 'b' }] as never;

        mapVegaLiteSpecToChart(vlSpec, meta, 'Chart 1', 'vis-1');

        expect(mockVegaliteMapper).toHaveBeenCalledTimes(1);
        expect(mockVegaliteMapper.mock.calls[0][0]).toBe(vlSpec);
        expect(mockVegaliteMapper.mock.calls[0][2]).toBe('Chart 1');
        expect(mockVegaliteMapper.mock.calls[0][3]).toBe('vis-1');
    });
});
