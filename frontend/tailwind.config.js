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
                'text-primary': '#e4e4e7'
            }
        },
    },
    plugins: [],
}
