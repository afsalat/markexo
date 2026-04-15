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
    theme: 'dark',
    toggleTheme: () => { },
    setTheme: () => { },
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('light');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load saved theme or default to light
        try {
            const savedTheme = localStorage.getItem('VorionMart-theme') as Theme;
            if (savedTheme === 'light' || savedTheme === 'dark') {
                setThemeState(savedTheme);
                updateDocumentClass(savedTheme);
            } else {
                // Default to light
                updateDocumentClass('light');
            }
        } catch (e) {
            updateDocumentClass('light');
        }
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
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
