import { debugLog, debugWarn, shouldDebugLog } from './debug';

describe('debug helpers', () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalGwDebug = process.env.GW_DEBUG;
    const originalGlobalFlag = (globalThis as { GW_DEBUG?: string | boolean }).GW_DEBUG;

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    afterEach(() => {
        process.env.NODE_ENV = originalNodeEnv;
        process.env.GW_DEBUG = originalGwDebug;
        (globalThis as { GW_DEBUG?: string | boolean }).GW_DEBUG = originalGlobalFlag;
        logSpy.mockClear();
        warnSpy.mockClear();
    });

    afterAll(() => {
        logSpy.mockRestore();
        warnSpy.mockRestore();
    });

    it('is disabled by default', () => {
        process.env.NODE_ENV = 'development';
        delete process.env.GW_DEBUG;
        (globalThis as { GW_DEBUG?: string | boolean }).GW_DEBUG = undefined;

        expect(shouldDebugLog()).toBe(false);

        debugLog('hello');
        debugWarn('warn');

        expect(logSpy).not.toHaveBeenCalled();
        expect(warnSpy).not.toHaveBeenCalled();
    });

    it('is enabled via GW_DEBUG env flag', () => {
        process.env.NODE_ENV = 'development';
        process.env.GW_DEBUG = 'true';

        expect(shouldDebugLog()).toBe(true);

        debugLog('hello');
        debugWarn('warn');

        expect(logSpy).toHaveBeenCalledWith('hello');
        expect(warnSpy).toHaveBeenCalledWith('warn');
    });

    it('is disabled in production even when flag is true', () => {
        process.env.NODE_ENV = 'production';
        process.env.GW_DEBUG = 'true';

        expect(shouldDebugLog()).toBe(false);

        debugLog('hello');
        debugWarn('warn');

        expect(logSpy).not.toHaveBeenCalled();
        expect(warnSpy).not.toHaveBeenCalled();
    });
});
