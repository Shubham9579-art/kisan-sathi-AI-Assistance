/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          500: '#22C55E',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16', // Deep Forest Green brand
        },
        leaf: {
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
        },
        cream: {
          50: '#FDFBF7',  // Primary background
          100: '#F9F6F0', // Card background
          200: '#EFEAE1', // Borders and dividers
          300: '#DFD8CC',
        },
        earth: {
          700: '#78350F',
          800: '#5F2809',
          900: '#451A03',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
