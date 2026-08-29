/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '!**/node_modules/**',
    '!./src/landlord_agent/node_modules/**',
    '!./src/landlord_agent/dist/**',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#F15A22',
        secondary: '#002B49',
        success: '#1D9E75',
        amber: '#BA7517',
      },
      fontFamily: {
        archivo: ['Archivo', 'sans-serif'],
        'nunito-sans': ['Nunito Sans', 'sans-serif'],
        archive: ['Archive', 'sans-serif'],
      },
      fontSize: {
        '2.5xl': '1.75rem', // 28px
      },
    },
  },
  plugins: [],
};