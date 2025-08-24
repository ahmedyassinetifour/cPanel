/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { 
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] 
      },
      colors: {
        brand: {
          50: '#eef7ff', 
          100: '#d9edff', 
          200: '#bfe0ff', 
          300: '#93ccff', 
          400: '#5db1ff',
          500: '#3a93ff', 
          600: '#2c75e6', 
          700: '#245ec0', 
          800: '#1f4f9e', 
          900: '#1d447f'
        }
      },
      boxShadow: {
        soft: '0 10px 30px -10px rgba(2,6,23,0.2)',
        glow: '0 0 0 4px rgba(59,130,246,0.15)'
      }
    },
  },
  plugins: [],
} 