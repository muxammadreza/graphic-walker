import { useEffect, useEffectEvent, useState } from 'react';
import { IDarkMode } from '../interfaces';

export function currentMediaTheme(): 'dark' | 'light' {
    if (typeof window === 'undefined' || !window.matchMedia) {
        return 'light';
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function useCurrentMediaTheme(mode: IDarkMode | undefined = 'media'): 'dark' | 'light' {
    const [theme, setTheme] = useState<'dark' | 'light'>(mode === 'media' ? currentMediaTheme() : mode);
    const handleMediaChange = useEffectEvent((e: MediaQueryListEvent) => {
        setTheme(e.matches ? 'dark' : 'light');
    });

    useEffect(() => {
        if (mode === 'media') {
            const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)') as MediaQueryList | undefined;
            if (!mediaQuery) {
                return;
            }

            setTheme(mediaQuery.matches ? 'dark' : 'light');
            mediaQuery.addEventListener('change', handleMediaChange);

            return () => {
                mediaQuery.removeEventListener('change', handleMediaChange);
            };
        }

        setTheme(mode);
    }, [mode, handleMediaChange]);

    return theme;
}
