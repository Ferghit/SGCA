import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B263B',
          50:  '#E8ECF2',
          100: '#C5D0DC',
          200: '#9EAFC3',
          300: '#778FAA',
          400: '#567898',
          500: '#3B6082',
          600: '#2D4D6A',
          700: '#1B263B',
          800: '#111828',
          900: '#070C13',
        },
        secondary: {
          DEFAULT: '#006D77',
          50:  '#E0F2F3',
          100: '#B3DDE0',
          200: '#7FC6CC',
          300: '#4BAEB7',
          400: '#259DA7',
          500: '#008C98',
          600: '#006D77',
          700: '#005059',
          800: '#00363B',
          900: '#001C1E',
        },
        accent: {
          DEFAULT: '#D4AF37',
          50:  '#FAF3DC',
          100: '#F3E2A8',
          200: '#EBCF73',
          300: '#E2BB3E',
          400: '#D4AF37',
          500: '#B8961F',
          600: '#9A7A14',
          700: '#7D5F0A',
          800: '#5E4605',
          900: '#3E2D01',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(27, 38, 59, 0.08)',
        'card-hover': '0 4px 16px rgba(27, 38, 59, 0.16)',
      },
    },
  },
  plugins: [],
};

export default config;
