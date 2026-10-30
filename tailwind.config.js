/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          50: '#f2f8f2',
          100: '#e1f0e1',
          200: '#c5e2c5',
          300: '#9bcca0',
          400: '#69b071',
          500: '#43944b',
          600: '#2f7737',
          700: '#255e2d',
          800: '#204b26',
          900: '#1b3f21',
          950: '#0c2211',
        },
        earth: {
          50: '#faf8f5',
          100: '#f3efe6',
          200: '#e6ded0',
          300: '#d4c5b1',
          400: '#bfa78f',
          500: '#aa8c72',
          600: '#96765e',
          700: '#7a5e4b',
          800: '#644e40',
          900: '#524136',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
