/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                background: '#121212',
                surface: {
                    DEFAULT: '#1E1E1E',
                    highlight: '#2A2A2A',
                },
                primary: {
                    DEFAULT: '#3B82F6',
                    foreground: '#FFFFFF',
                },
                text: {
                    primary: '#FFFFFF',
                    secondary: '#A1A1AA',
                },
            },
        },
    },
    plugins: [],
}
