import React from 'react';
import { describe, expect, it, vi } from 'bun:test';
import { GlobalRegistrator } from '@happy-dom/global-registrator';
import { fireEvent, render } from '@testing-library/react';
import SideResize from './side-resize';

if (typeof window === 'undefined') {
    GlobalRegistrator.register();
}

describe('SideResize', () => {
    it('binds global drag listeners only while resizing', () => {
        const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
        const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

        const { container } = render(
            <SideResize defaultWidth={200}>
                <div>content</div>
            </SideResize>,
        );

        const mouseMoveAddsOnMount = addEventListenerSpy.mock.calls.filter(([eventName]) => eventName === 'mousemove');
        const mouseUpAddsOnMount = addEventListenerSpy.mock.calls.filter(([eventName]) => eventName === 'mouseup');

        expect(mouseMoveAddsOnMount.length).toBe(0);
        expect(mouseUpAddsOnMount.length).toBe(0);

        const dragHandle = container.querySelector('.cursor-col-resize');
        if (!dragHandle) {
            throw new Error('SideResize drag handle not found');
        }

        fireEvent.mouseDown(dragHandle);

        const mouseMoveAddsAfterMouseDown = addEventListenerSpy.mock.calls.filter(([eventName]) => eventName === 'mousemove');
        const mouseUpAddsAfterMouseDown = addEventListenerSpy.mock.calls.filter(([eventName]) => eventName === 'mouseup');

        expect(mouseMoveAddsAfterMouseDown.length).toBe(1);
        expect(mouseUpAddsAfterMouseDown.length).toBe(1);

        fireEvent.mouseMove(window, { clientX: 250 });

        const sidebar = container.firstElementChild as HTMLDivElement;
        expect(sidebar.style.width).toBe('250px');

        fireEvent.mouseUp(window);

        const mouseMoveRemoves = removeEventListenerSpy.mock.calls.filter(([eventName]) => eventName === 'mousemove');
        const mouseUpRemoves = removeEventListenerSpy.mock.calls.filter(([eventName]) => eventName === 'mouseup');

        expect(mouseMoveRemoves.length).toBe(1);
        expect(mouseUpRemoves.length).toBe(1);

        addEventListenerSpy.mockRestore();
        removeEventListenerSpy.mockRestore();
    });
});
