/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#12181B',
          900: '#161D21',
          800: '#1E272C',
          700: '#2A363C',
          600: '#3A4950',
        },
        paper: '#F4F1EA',
        parchment: '#EDE7DA',
        moss: {
          400: '#6FAE8C',
          500: '#4C9A79',
          600: '#3B7C61',
        },
        amber: {
          400: '#E3A25C',
          500: '#D98E4A',
        },
        rust: {
          400: '#E1766A',
          500: '#C85A4C',
        },
        gold: '#C9A15C',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(18, 24, 27, 0.06), 0 4px 16px rgba(18, 24, 27, 0.05)',
      },
    },
  },
  plugins: [],
}
