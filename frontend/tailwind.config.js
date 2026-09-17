/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Azul institucional, sobrio: usado em cabecalho, acoes e destaques
        brand: {
          50: '#eef4fb',
          100: '#d8e6f5',
          200: '#b3cbe9',
          300: '#82a8d8',
          400: '#5183c2',
          500: '#2f63a6',
          600: '#1d4e89',
          700: '#183f6e',
          800: '#143154',
          900: '#0f2540',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 37 64 / 0.05), 0 1px 3px 0 rgb(15 37 64 / 0.06)',
        'card-hover': '0 4px 12px -2px rgb(15 37 64 / 0.12)',
      },
    },
  },
  plugins: [],
}
