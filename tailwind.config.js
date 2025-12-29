/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Base colors
                canvas: '#FAFAF8',
                ink: '#0A0A0A',
                border: {
                    DEFAULT: '#D0D0D0',
                    active: '#0A0A0A',
                },
                // Protocol-aware accents
                orange: '#FF5500',
                uniswap: '#FF007A',
                aave: '#B6509E',
                success: '#00D395',
                error: '#FF4444',
                // Grays
                gray: {
                    50: '#F9F9F7',
                    100: '#F5F5F3',
                    200: '#E0E0E0',
                    300: '#CCCCCC',
                    400: '#AAAAAA',
                    500: '#888888',
                    600: '#666666',
                    700: '#444444',
                    800: '#0A0A0A',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['IBM Plex Mono', 'Menlo', 'monospace'],
            },
            fontSize: {
                'h1': ['24px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '0.05em' }],
                'h2': ['16px', { lineHeight: '1.3', fontWeight: '700' }],
                'h3': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
                'body': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
                'small': ['12px', { lineHeight: '1.4', fontWeight: '400' }],
                'data': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
            },
            spacing: {
                '1': '6px',
                '2': '12px',
                '3': '24px',
                '4': '48px',
                '5': '72px',
                '6': '96px',
            },
            borderRadius: {
                none: '0px',
            },
            transitionDuration: {
                instant: '0ms',
                fast: '100ms',
            },
            transitionTimingFunction: {
                none: 'linear',
            },
        },
    },
    plugins: [],
}
