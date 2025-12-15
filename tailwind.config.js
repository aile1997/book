/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#E9DFFC',
          DEFAULT: '#BE9FF6',
          dark: '#784DC7',
        },
        gray: {
          dark: '#292929',
          DEFAULT: '#B9B9B9',
          light: '#EAEAEA',
          lighter: '#CCC',
        },
        success: '#38D87B',
        warning: '#F6BA13',
        cyan: '#51D5FF',
      },
      fontFamily: {
        sans: ['Rethink Sans', 'SF Pro', '-apple-system', 'Roboto', 'Helvetica', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 8px 0 rgba(41, 41, 41, 0.08)',
      },
    },
  },
  plugins: [],
}
