const getNodeEnv = (): string | undefined => {
    if (typeof process === 'undefined') {
        return undefined;
    }
    return process.env?.NODE_ENV;
};

const getDebugEnvFlag = (): string | boolean | undefined => {
    if (typeof process === 'undefined') {
        return undefined;
    }
    return process.env?.GW_DEBUG;
};

const getGlobalDebugFlag = (): string | boolean | undefined => {
    if (typeof globalThis === 'undefined') {
        return undefined;
    }
    return (globalThis as { GW_DEBUG?: string | boolean }).GW_DEBUG;
};

const toBooleanFlag = (value: string | boolean | undefined): boolean => {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }
    return false;
};

export const shouldDebugLog = (): boolean => {
    const isProduction = getNodeEnv() === 'production';
    if (isProduction) {
        return false;
    }

    return toBooleanFlag(getDebugEnvFlag()) || toBooleanFlag(getGlobalDebugFlag());
};

export const debugLog = (...args: unknown[]): void => {
    if (!shouldDebugLog()) {
        return;
    }
    console.log(...args);
};

export const debugWarn = (...args: unknown[]): void => {
    if (!shouldDebugLog()) {
        return;
    }
    console.warn(...args);
};
