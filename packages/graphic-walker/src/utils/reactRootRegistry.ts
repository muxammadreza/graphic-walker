import type { ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';

type EmbeddedRootOptions = Parameters<typeof createRoot>[1];
type RootErrorHandler = NonNullable<NonNullable<EmbeddedRootOptions>['onCaughtError' | 'onUncaughtError' | 'onRecoverableError']>;
type RootErrorInfo = Parameters<RootErrorHandler>[1];

const embeddedRootRegistry = new WeakMap<HTMLElement, Root>();

function logEmbeddedRootError(prefix: string, error: unknown, errorInfo: RootErrorInfo): void {
    const payload = {
        error,
        componentStack: errorInfo.componentStack,
    };

    if (prefix.includes('recoverable')) {
        console.debug(prefix, payload);
        return;
    }

    console.error(prefix, payload);
}

export function createEmbeddedRootOptions(identifierHint = 'embed'): NonNullable<EmbeddedRootOptions> {
    return {
        identifierPrefix: `gw-${identifierHint}-`,
        onCaughtError: (error, errorInfo) => {
            logEmbeddedRootError('Graphic Walker embed caught React error', error, errorInfo);
        },
        onUncaughtError: (error, errorInfo) => {
            logEmbeddedRootError('Graphic Walker embed uncaught React error', error, errorInfo);
        },
        onRecoverableError: (error, errorInfo) => {
            logEmbeddedRootError('Graphic Walker embed recoverable React error', error, errorInfo);
        },
    };
}

export function getOrCreateEmbeddedRoot(dom: HTMLElement, identifierHint = 'embed'): Root {
    const existingRoot = embeddedRootRegistry.get(dom);
    if (existingRoot) {
        return existingRoot;
    }

    const createdRoot = createRoot(dom, createEmbeddedRootOptions(identifierHint));
    embeddedRootRegistry.set(dom, createdRoot);
    return createdRoot;
}

export function renderEmbeddedNode(dom: HTMLElement, node: ReactNode, identifierHint = 'embed'): void {
    getOrCreateEmbeddedRoot(dom, identifierHint).render(node);
}

export function unmountEmbeddedRoot(dom: HTMLElement | null | undefined): void {
    if (!dom) {
        return;
    }

    const existingRoot = embeddedRootRegistry.get(dom);
    if (!existingRoot) {
        return;
    }

    existingRoot.unmount();
    embeddedRootRegistry.delete(dom);
}
