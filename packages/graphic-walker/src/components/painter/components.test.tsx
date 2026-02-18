import React from 'react';
import { describe, expect, it, vi } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { fireEvent, render } from '@testing-library/react';
import { ShadowDomContext } from '../../shadow-dom';
import { ColorEditor } from './components';

if (typeof window === 'undefined') {
    GlobalRegistrator.register();
}

void vi.mock('../color-picker', () => ({
    StyledPicker: ({ color }: { color: string }) => <div data-testid="mock-picker">{color}</div>,
}));

describe('ColorEditor', () => {
    it('moves click listener to new ShadowDom root when root changes while editor is open', () => {
        const rootA = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        } as unknown as ShadowRoot;
        const rootB = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        } as unknown as ShadowRoot;

        const { container, rerender, getByText } = render(
            <ShadowDomContext.Provider value={{ root: rootA }}>
                <ColorEditor color="#111111" colors={['#111111']} onChangeColor={vi.fn()} />
            </ShadowDomContext.Provider>
        );

        const trigger = container.querySelector('.w-8.h-5.border-2');
        if (!trigger) {
            throw new Error('ColorEditor trigger element not found');
        }
        fireEvent.click(trigger);

        expect(getByText('Save')).toBeTruthy();
        expect(rootA.addEventListener).toHaveBeenCalledTimes(1);

        rerender(
            <ShadowDomContext.Provider value={{ root: rootB }}>
                <ColorEditor color="#111111" colors={['#111111']} onChangeColor={vi.fn()} />
            </ShadowDomContext.Provider>
        );

        expect(rootA.removeEventListener).toHaveBeenCalledTimes(1);
        expect(rootB.addEventListener).toHaveBeenCalledTimes(1);
    });
});
