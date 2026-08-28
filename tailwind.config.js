/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#F15A22',
        secondary: '#002B49',
        success: '#1D9E75',
        amber: '#BA7517',
        ink: {
          DEFAULT: '#0E2233',
          soft: '#1B3A52',
          muted: '#3A4A57',
        },
        ground: '#E7ECEE',
        paper: '#FFFFFF',
        rule: '#D2DADE',
        seal: {
          DEFAULT: '#136C9E',
          deep: '#0B4F76',
        },
        stamp: {
          DEFAULT: '#F15A22',
          hover: '#D54A1A',
        },
        verified: '#1C6B54',
        note: '#9A5B08',
        pending: {
          DEFAULT: '#7E8C97',
          line: '#A9B4BB',
          text: '#5C6B76',
          bg: '#E3E8EA',
        },
        brand: {
          navy: '#14385C',
          cream: '#F7F2E8',
          'cream-deep': '#F3ECDD',
          blue: '#136C9E',
          'blue-deep': '#0D4F74',
          'blue-light': '#EAF4FA',
          'blue-soft': '#D6EBF5',
        },
      },
      fontFamily: {
        archivo: ['Archivo', 'sans-serif'],
        'nunito-sans': ['Nunito Sans', 'sans-serif'],
        archive: ['Archive', 'sans-serif'],
        display: ['Archivo', 'system-ui', 'sans-serif'],
        report: ['"Public Sans"', 'system-ui', 'sans-serif'],
        plex: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2.5xl': '1.75rem', // 28px
      },
    },
  },
  plugins: [],
};