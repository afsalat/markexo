'use client';

import { useTheme } from '@/context/ThemeContext';
import { useEffect } from 'react';

/**
 * AdminThemeWrapper forces the theme to dark mode for all admin pages.
 * It also provides a root container with the dark class.
 */
export default function AdminThemeWrapper({ children }: { children: React.ReactNode }) {
    const { setTheme } = useTheme();

    useEffect(() => {
        // Force dark mode on mount
        setTheme('dark');
        
        // Add dark class to body for extra protection
        document.body.classList.add('dark');
        document.body.classList.remove('light');
        
        return () => {
            // Optional: Restore light mode or user preference when leaving admin
            // But usually admin should stay dark
        };
    }, [setTheme]);

    return (
        <div className="min-h-screen bg-dark-950 text-silver-100 overflow-x-hidden selection:bg-accent-500/30 selection:text-accent-200">
            {children}
        </div>
    );
}
