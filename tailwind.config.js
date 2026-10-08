import { theme } from './src/lib/theme.js'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Colour names kept from the original design; values come from src/lib/theme.js.
      colors: {
        ink: {
          950: theme.bg,
          900: theme.surface,
          800: theme.field,
          700: theme.line,
          600: theme.faint,
          500: theme.muted,
        },
        paper: theme.text,
        moss: { 400: theme.income, 500: theme.incomeBar, 600: theme.incomeDark },
        amber: { 400: theme.highlight, 500: theme.highlightStrong },
        rust: { 400: theme.spent, 500: theme.spentBar },
        gold: { DEFAULT: theme.accent, 600: theme.accentStrong },
      },
      fontFamily: {
        display: ['"Space Grotesk Variable"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.25), 0 4px 16px rgba(0,0,0,0.18)',
      },
    },
  },
  plugins: [],
}
