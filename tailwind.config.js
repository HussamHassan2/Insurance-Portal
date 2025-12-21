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
                    DEFAULT: '#0056b3', // Deep Corporate Blue
                    light: '#007bff',   // Bright Action Blue
                    dark: '#004494',
                },
                navy: {
                    DEFAULT: '#0D1B2A',
                    light: '#1B2A3D',
                },
                secondary: '#6c757d',

            },
            fontFamily: {
                sans: ['Roboto', 'sans-serif'],
                heading: ['Roboto', 'sans-serif'],
                body: ['Open Sans', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
