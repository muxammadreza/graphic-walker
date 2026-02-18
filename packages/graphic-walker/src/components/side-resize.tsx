import React, { useEffect, useEffectEvent, useRef, useState } from 'react';

export default function SideResize(props: {
    defaultWidth: number;
    handleWidth?: number;
    className?: string;
    handlerClassName?: string;
    children?: React.ReactNode | Iterable<React.ReactNode>;
}) {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(props.defaultWidth);
    const startResizing = () => {
        setIsResizing(true);
    };

    const stopResizing = () => {
        setIsResizing(false);
    };

    const onResize = useEffectEvent((mouseMoveEvent: MouseEvent) => {
        if (!isResizing || !sidebarRef.current) {
            return;
        }

        const nextWidth = mouseMoveEvent.clientX - sidebarRef.current.getBoundingClientRect().left;
        setSidebarWidth((prev) => (prev === nextWidth ? prev : nextWidth));
    });

    useEffect(() => {
        if (!isResizing) {
            return;
        }

        const handleMouseMove = (event: MouseEvent) => {
            onResize(event);
        };

        const handleMouseUp = () => {
            stopResizing();
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    return (
        <div className={`relative ${props.className}`} style={{ width: sidebarWidth }} ref={sidebarRef}>
            {props.children}
            <div className={`absolute right-0 inset-y-0 cursor-col-resize ${props.handlerClassName}`} style={{ width: props.handleWidth ?? 6 }} onMouseDown={startResizing}></div>
        </div>
    );
}
