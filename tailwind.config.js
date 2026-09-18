/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cui: {
          navy: '#002147',
          'navy-dark': '#001530',
          'navy-light': '#0b3569',
          blue: '#134e8d',
          accent: '#0284c7',
          gold: '#c29b38',
          'gold-light': '#fdf4dc',
          'gold-dark': '#99731b',
          surface: '#f8fafc',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', '-apple-system', 'BlinkMacSystemFont', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        sis: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'sis-card': '0 2px 5px -1px rgba(0, 33, 71, 0.08), 0 1px 3px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
