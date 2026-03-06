/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                // VorionMart Dark Theme
                dark: {
                    950: '#050508', // Deepest black-blue
                    900: '#0a0a0f', // Base background
                    800: '#12121a', // Cards / Secondary
                    700: '#1a1a2e', // Borders / Accents
                    600: '#252542',
                    500: '#2f2f52',
                },
                // Electric Cyan (Primary Brand Color)
                accent: {
                    50: '#ecfeff',
                    100: '#cffafe',
                    200: '#a5f3fc',
                    300: '#67e8f9',
                    400: '#22d3ee',
                    500: '#00f5d4', // MAIN BRAND COLOR
                    600: '#00d4b8',
                    700: '#00b39c',
                    800: '#0891b2',
                    900: '#164e63',
                },
                // Electric Purple (Secondary Accent)
                primary: {
                    50: '#faf5ff',
                    100: '#f3e8ff',
                    200: '#e9d5ff',
                    300: '#d8b4fe',
                    400: '#c084fc',
                    500: '#a855f7',
                    600: '#9333ea',
                    700: '#7c3aed',
                    800: '#6b21a8',
                    900: '#581c87',
                },
                // Neutral Silver
                silver: {
                    50: '#f8fafc',
                    100: '#f1f5f9',
                    200: '#e2e8f0',
                    300: '#cbd5e1',
                    400: '#94a3b8',
                    500: '#64748b',
                    600: '#475569',
                    700: '#334155',
                    800: '#1e293b',
                    900: '#0f172a',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Space Grotesk', 'Outfit', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-in': 'slideIn 0.3s ease-out',
                'scale-in': 'scaleIn 0.3s ease-out',
                'glow': 'glow 2s ease-in-out infinite',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateX(-10px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
                scaleIn: {
                    '0%': { opacity: '0', transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                glow: {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(0, 245, 212, 0.3)' },
                    '50%': { boxShadow: '0 0 40px rgba(0, 245, 212, 0.6)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'hero-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
                'card-gradient': 'linear-gradient(180deg, rgba(26,26,46,0.8) 0%, rgba(10,10,15,0.95) 100%)',
                'accent-gradient': 'linear-gradient(135deg, #00f5d4 0%, #7c3aed 100%)',
            },
            boxShadow: {
                'glow-sm': '0 0 10px rgba(0, 245, 212, 0.3)',
                'glow': '0 0 20px rgba(0, 245, 212, 0.4)',
                'glow-lg': '0 0 40px rgba(0, 245, 212, 0.5)',
                'glow-purple': '0 0 20px rgba(124, 58, 237, 0.4)',
            },
        },
    },
    plugins: [],
}
