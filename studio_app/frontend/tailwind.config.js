/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'app-bg': '#09090b',
                'panel-bg': '#141416',
                'border-color': '#27272a',
                'accent-blue': '#3b82f6',
                'text-primary': '#e4e4e7',
                // Masterpiece UI Tokens
                'glass': 'rgba(23, 23, 23, 0.6)',
                'glass-border': 'rgba(255, 255, 255, 0.08)',
                'neon-blue': '#3b82f6',
                'neon-purple': '#8b5cf6',
            },
            boxShadow: {
                'glow-sm': '0 0 10px rgba(59, 130, 246, 0.3)',
                'glow-md': '0 0 20px rgba(59, 130, 246, 0.5)',
                'glass-inset': 'inset 0 0 20px rgba(255, 255, 255, 0.02)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                }
            }
        },
    },
    plugins: [],
}
