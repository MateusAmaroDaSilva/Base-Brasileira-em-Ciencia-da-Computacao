/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta da marca BBCC. O tom 600 e o azul-marinho do logo (#16325C).
        brand: {
          50: '#f2f5f9',
          100: '#e1e8f1',
          200: '#c3d1e3',
          300: '#94aecb',
          400: '#5c82ac',
          500: '#2f5a8c',
          600: '#16325c',
          700: '#122a4d',
          800: '#0e203c',
          900: '#0a182d',
        },
        // Verde de destaque do logo
        verde: {
          50: '#eaf5f0',
          100: '#d0e9de',
          200: '#a5d6c1',
          600: '#1e7f57',
          700: '#186748',
        },
        // Amarelo de detalhe do logo
        amarelo: {
          100: '#fcf2d8',
          200: '#f7e3aa',
          400: '#e8b931',
          500: '#c99f21',
        },
        creme: '#faf8f3',
        tinta: {
          DEFAULT: '#4a4a4a',
          claro: '#d5ddea',
        },
      },
      fontFamily: {
        // Fraunces e a fonte do "BBCC" no logo; IBM Plex Sans, a do subtitulo
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"IBM Plex Sans"', 'Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(22 50 92 / 0.06), 0 1px 3px 0 rgb(22 50 92 / 0.08)',
        'card-hover': '0 6px 16px -4px rgb(22 50 92 / 0.16)',
      },
    },
  },
  plugins: [],
}
