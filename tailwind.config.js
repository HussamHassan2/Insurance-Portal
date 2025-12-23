/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{html,ts}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    light: 'rgba(var(--color-primary-rgb), 0.1)',
                    dark: 'rgba(var(--color-primary-rgb), 0.9)',
                },
                secondary: {
                    DEFAULT: 'var(--color-secondary)',
                    light: 'rgba(var(--color-secondary-rgb), 0.1)',
                    dark: 'rgba(var(--color-secondary-rgb), 0.9)',
                },
                accent: {
                    DEFAULT: 'var(--color-accent)',
                    light: 'rgba(var(--color-accent-rgb), 0.1)',
                    dark: 'rgba(var(--color-accent-rgb), 0.9)',
                },
                navy: {
                    DEFAULT: 'var(--color-brand-dark)',
                    light: '#1B2A3D',
                },
            },
            fontFamily: {
                sans: ['var(--font-family-body)'],
                heading: ['var(--font-family-heading)'],
                body: ['var(--font-family-body)'],
            },
        },
    },
    plugins: [],
}
