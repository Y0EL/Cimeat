import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        accent: { DEFAULT: '#f59e0b', light: '#fbbf24' },
        success: { DEFAULT: '#22c55e', light: '#4ade80' },
        warning: { DEFAULT: '#f59e0b', light: '#fbbf24' },
        danger: { DEFAULT: '#ef4444', light: '#f87171' },
        info: { DEFAULT: '#0ea5e9', light: '#38bdf8' },
        // Warm cream surfaces for light mode
        cream: { DEFAULT: '#fffaf5', soft: '#fff7ed' },
        // Macro palette (kept consistent across charts/rings)
        macro: {
          calories: '#f97316',
          protein: '#f43f5e',
          carb: '#f59e0b',
          fat: '#0ea5e9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Inter Tight', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        input: '14px',
        card: '20px',
        sheet: '28px',
      },
    },
  },
  plugins: [],
} satisfies Config
