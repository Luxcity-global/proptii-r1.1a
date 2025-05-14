/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    screens: {
      'xs': '0px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
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
      spacing: {
        'container-xs': '16px',
        'container-md': '24px',
        'container-lg': '32px',
      },
      fontSize: {
        // Mobile (xs)
        'heading-xs': ['20px', '28px'],
        'body-xs': ['14px', '20px'],
        'small-xs': '12px',
        
        // Tablet (md)
        'heading-md': ['24px', '32px'],
        'body-md': ['16px', '24px'],
        'small-md': '14px',
        
        // Desktop (lg)
        'heading-lg': ['28px', '40px'],
        'body-lg': ['16px', '24px'],
        'small-lg': '14px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '16px',
          sm: '16px',
          md: '24px',
          lg: '32px',
          xl: '32px',
          '2xl': '32px',
        },
      },
    },
  },
  plugins: [],
}