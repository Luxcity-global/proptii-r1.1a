/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#F15A22',
        secondary: '#002B49',
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