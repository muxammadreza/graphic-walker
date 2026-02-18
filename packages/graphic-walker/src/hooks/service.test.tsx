import { describe, expect, it, vi } from 'bun:test';
import { renderHook, waitFor } from '@testing-library/react';
import type { IGeoUrl } from '../interfaces';
import { useGeoJSON } from './service';

describe('useGeoJSON', () => {
    it('retries fetch after a previous request for the same URL fails', async () => {
        const urlKey = `https://example.com/geo-${Date.now()}-${Math.random().toString(16).slice(2)}.json`;
        const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const fetchMock = vi
            .fn()
            .mockRejectedValueOnce(new Error('network failed'))
            .mockResolvedValueOnce({
                json: async () => ({ type: 'FeatureCollection', features: [] }),
            });

        const originalFetch = globalThis.fetch;
        globalThis.fetch = fetchMock as unknown as typeof fetch;

        const { rerender } = renderHook(({ url }: { url: IGeoUrl }) => useGeoJSON(undefined, url), {
            initialProps: { url: { type: 'GeoJSON', url: urlKey } },
        });

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        rerender({ url: { type: 'GeoJSON', url: urlKey } });

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledTimes(2);
        });

        globalThis.fetch = originalFetch;
        consoleErrorSpy.mockRestore();
    });
});
