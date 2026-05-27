import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#FF6B35',
          light: '#FF8C61',
          dark: '#E5521C',
          50: '#FFF3EE',
          100: '#FFE4D6',
        },
        primary: {
          50: '#FFF3EE',
          100: '#FFE4D6',
          200: '#FFCAAA',
          300: '#FF8C61',
          400: '#FF7A4C',
          500: '#FF6B35',
          600: '#FF6B35',
          700: '#E5521C',
          800: '#C4401A',
          900: '#9A2F12',
          950: '#5C1A08',
          DEFAULT: '#FF6B35',
        },
        green: { DEFAULT: '#22C55E', light: '#4ADE80' },
        charcoal: '#1A1C1E',
        bg: '#F8F7F4',
        cream: { DEFAULT: '#F8F7F4', soft: '#FFF3EE' },
        card: '#FFFFFF',
        dim: '#8A8886',
        macro: {
          calories: '#FF6B35',
          protein: '#f43f5e',
          carb: '#f59e0b',
          fat: '#0ea5e9',
        },
        danger: { DEFAULT: '#ef4444', light: '#f87171' },
        warning: { DEFAULT: '#f59e0b', light: '#fbbf24' },
      },
      fontFamily: {
        sans: ['Outfit_400Regular', 'system-ui', 'sans-serif'],
        display: ['Outfit_900Black', 'Outfit_700Bold', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        input: '14px',
        card: '24px',
        sheet: '32px',
        '4xl': '32px',
        '5xl': '40px',
      },
    },
  },
  plugins: [],
} satisfies Config
