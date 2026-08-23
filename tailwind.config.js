/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        archivo: ['Archivo', 'sans-serif'],
        'nunito-sans': ['"Nunito Sans"', 'Nunito', 'sans-serif'],
        nunito: ['"Nunito Sans"', 'Nunito', 'sans-serif'],
        sans: ['"Nunito Sans"', 'Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#F15A22',
        secondary: '#002B49',
      },
    },
  },
  plugins: [],
};