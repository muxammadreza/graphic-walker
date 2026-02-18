import { describe, expect, it, vi } from 'bun:test';
import { readTextFile } from './readTextFile';

type ReaderCallbacks = {
    onload: ((event: ProgressEvent<FileReader>) => void) | null;
    onerror: ((event: ProgressEvent<FileReader>) => void) | null;
    onabort: ((event: ProgressEvent<FileReader>) => void) | null;
};

describe('readTextFile', () => {
    it('resolves file text from FileReader onload', async () => {
        const file = new File(['{"k":1}'], 'demo.json', { type: 'application/json' });
        const callbacks: ReaderCallbacks = { onload: null, onerror: null, onabort: null };

        class ReaderMock {
            result: string | ArrayBuffer | null = null;
            error: DOMException | null = null;
            onload: ReaderCallbacks['onload'] = null;
            onerror: ReaderCallbacks['onerror'] = null;
            onabort: ReaderCallbacks['onabort'] = null;

            readAsText = vi.fn(() => {
                callbacks.onload = this.onload;
                callbacks.onerror = this.onerror;
                callbacks.onabort = this.onabort;
                this.result = '{"k":1}';
                this.onload?.({ target: this } as unknown as ProgressEvent<FileReader>);
            });
        }

        const originalReader = globalThis.FileReader;
        globalThis.FileReader = ReaderMock as unknown as typeof FileReader;

        const result = await readTextFile(file);
        expect(result).toBe('{"k":1}');

        globalThis.FileReader = originalReader;
    });

    it('rejects when FileReader triggers an error', async () => {
        const file = new File(['x'], 'broken.txt', { type: 'text/plain' });

        class ReaderMock {
            result: string | ArrayBuffer | null = null;
            error: DOMException | null = new DOMException('read failed');
            onload: ((event: ProgressEvent<FileReader>) => void) | null = null;
            onerror: ((event: ProgressEvent<FileReader>) => void) | null = null;
            onabort: ((event: ProgressEvent<FileReader>) => void) | null = null;

            readAsText = vi.fn(() => {
                this.onerror?.({ target: this } as unknown as ProgressEvent<FileReader>);
            });
        }

        const originalReader = globalThis.FileReader;
        globalThis.FileReader = ReaderMock as unknown as typeof FileReader;

        await expect(readTextFile(file)).rejects.toThrow('read failed');

        globalThis.FileReader = originalReader;
    });
});
