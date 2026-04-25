'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// VorionMart - Dark Only Theme
type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const defaultContext: ThemeContextType = {
    theme: 'light',
    toggleTheme: () => { },
    setTheme: () => { },
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Force light theme for storefront
        setThemeState('light');
        updateDocumentClass('light');
    }, []);

    const updateDocumentClass = (newTheme: Theme) => {
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.classList.remove('light');
        } else {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        updateDocumentClass(newTheme);
        try {
            localStorage.setItem('VorionMart-theme', newTheme);
        } catch (e) {
            // ignore
        }
    };

    return (
        <ThemeContext.Provider value={{ theme: 'light', toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
