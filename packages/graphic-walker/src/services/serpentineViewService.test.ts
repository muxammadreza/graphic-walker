import { afterEach, describe, expect, it, vi } from 'bun:test';
import { serpentineViewService } from './serpentineViewService';

type MockView = {
    signal: ReturnType<typeof vi.fn>;
    runAsync: ReturnType<typeof vi.fn>;
    addSignalListener: ReturnType<typeof vi.fn>;
    removeSignalListener: ReturnType<typeof vi.fn>;
};

const makeView = (): MockView => ({
    signal: vi.fn(),
    runAsync: vi.fn(),
    addSignalListener: vi.fn(),
    removeSignalListener: vi.fn(),
});

describe('serpentineViewService', () => {
    afterEach(() => {
        serpentineViewService.setView('instance-a', null);
        serpentineViewService.setView('instance-b', null);
    });

    it('stores and resolves views by instance', () => {
        const viewA = makeView() as any;
        const viewB = makeView() as any;

        serpentineViewService.setView('instance-a', viewA);
        serpentineViewService.setView('instance-b', viewB);

        expect(serpentineViewService.getView('instance-a')).toBe(viewA);
        expect(serpentineViewService.getView('instance-b')).toBe(viewB);
    });

    it('updates signals only on targeted instance view', () => {
        const viewA = makeView() as any;
        const viewB = makeView() as any;
        serpentineViewService.setView('instance-a', viewA);
        serpentineViewService.setView('instance-b', viewB);

        serpentineViewService.updateSignal('instance-a', 'foo', 42);

        expect(viewA.signal).toHaveBeenCalledWith('foo', 42);
        expect(viewA.runAsync).toHaveBeenCalledTimes(1);
        expect(viewB.signal).not.toHaveBeenCalled();
        expect(viewB.runAsync).not.toHaveBeenCalled();
    });

    it('adds and removes listeners only on targeted instance view', () => {
        const handler = vi.fn();
        const viewA = makeView() as any;
        const viewB = makeView() as any;
        serpentineViewService.setView('instance-a', viewA);
        serpentineViewService.setView('instance-b', viewB);

        serpentineViewService.addSignalListener('instance-a', 'foo', handler);
        serpentineViewService.removeSignalListener('instance-a', 'foo', handler);

        expect(viewA.addSignalListener).toHaveBeenCalledWith('foo', handler);
        expect(viewA.removeSignalListener).toHaveBeenCalledWith('foo', handler);
        expect(viewB.addSignalListener).not.toHaveBeenCalled();
        expect(viewB.removeSignalListener).not.toHaveBeenCalled();
    });
});
